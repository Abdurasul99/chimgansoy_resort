import Link from "next/link";
import { AdminHeading } from "../AdminShell";
import { Grid } from "./Grid";
import { NewBooking } from "../broni/NewBooking";
import { listRates, listUnits, occupancy, type BookingRow, type RateRow, type UnitRow } from "@/lib/pms";
import { exelyOccupancy } from "@/lib/exely-occupancy";
import { exelyRates } from "@/lib/exely-rates";
import { poolPricing } from "@/content/pricing";

/**
 * Шахматка: кто где стоит и почём.
 *
 * Тридцать дней в окне — больше не помещается на экран даже с прокруткой, а
 * меньше не даёт увидеть месяц целиком, ради чего сетку и открывают.
 */
export const dynamic = "force-dynamic";
/** Ширина окна. Неделя — чтобы разглядеть день, месяц — чтобы увидеть сезон. */
const WINDOWS = [7, 14, 30] as const;

const pill =
  "rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--sun)]";
const pillOn = "rounded-full border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white";

function shift(days: number): string {
  return new Date(Date.now() + 5 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10);
}

export default async function ShahmatkaPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; w?: string }>;
}) {
  const { start, w } = await searchParams;
  const DAYS = WINDOWS.find((x) => String(x) === w) ?? 30;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(start ?? "") ? start! : shift(0);
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(`${from}T12:00:00`);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const to = days[days.length - 1];

  let units: UnitRow[] = [];
  let bookings: BookingRow[] = [];
  let rates: RateRow[] = [];
  /** Цены из Exely по датам: то же, что видит гость на сайте. */
  let live: Record<string, Record<string, number>> = {};
  let error: string | null = null;
  try {
    const [u, ours, r, theirs] = await Promise.all([
      listUnits(),
      occupancy(from, to),
      listRates(from, to),
      // Их брони не должны ронять экран: не ответили — покажем свои.
      exelyOccupancy(from, to).catch(() => [] as BookingRow[]),
    ]);
    // Отдельно и терпимо к сбоям: без цен сетка остаётся сеткой.
    live = await exelyRates(days).catch(() => ({}));
    units = u;
    rates = r;
    // Наши первыми: при совпадении номера и дат в клетке окажется наша запись,
    // которую оператор может открыть и поправить, а не чужая только для чтения.
    bookings = [...ours, ...theirs];
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  /**
   * Обычная цена — её показывает строка цен там, где своей на дату нет.
   *
   * Цены за ночь живут в Exely, а не в нашем прайсе: тот считает дневные услуги.
   * Здесь стоят те же числа, что на карточках домиков, — как ориентир, пока
   * оператор не задал свою цену на конкретные даты.
   */
  const basePrice: Record<string, number> = {
    glamping: 1_500_000,
    cottage: 3_000_000,
    // Бунгало у бассейна — дневная аренда, цифры из прайса оператора.
    "bungalow-small": poolPricing.extras.bungalow4,
    "bungalow-large": poolPricing.extras.bungalow10,
  };

  const nav = (offset: number) => {
    const d = new Date(`${from}T12:00:00`);
    d.setDate(d.getDate() + offset);
    return `/admin/shahmatka?start=${d.toISOString().slice(0, 10)}`;
  };

  return (
    <>
      <AdminHeading
        title="Шахматка"
        hint="Двадцать домиков и месяц вперёд. Бронь попадает сюда, когда за ней закреплён номер."
      />
      {error ? (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
          Не удалось прочитать базу: {error}
        </p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Link href={nav(-DAYS)} className={pill}>← назад</Link>
            <Link href={`/admin/shahmatka?w=${DAYS}`} className={pill}>сегодня</Link>
            <Link href={nav(DAYS)} className={pill}>вперёд →</Link>

            {/* Ширина окна: неделя — разглядеть день, месяц — увидеть сезон. */}
            <span className="ml-2 flex gap-2">
              {WINDOWS.map((n) => (
                <Link
                  key={n}
                  href={`/admin/shahmatka?start=${from}&w=${n}`}
                  className={n === DAYS ? pillOn : pill}
                >
                  {n === 7 ? "неделя" : n === 14 ? "две недели" : "месяц"}
                </Link>
              ))}
            </span>

            {/* Переход к произвольной дате: листать до октября кнопками — долго. */}
            <form className="flex items-center gap-2">
              <input type="hidden" name="w" value={DAYS} />
              <input
                type="date"
                name="start"
                defaultValue={from}
                className="rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
              />
              <button type="submit" className={pill}>
                перейти
              </button>
            </form>

            <span className="text-sm text-[var(--muted)]">{from} — {to}</span>
          </div>
          {/* Та же форма, что и на экране броней: оператор смотрит сетку,
              видит свободное бунгало на субботу и заводит бронь здесь же, не
              уходя на другой экран и не теряя из виду, что свободно. */}
          <div className="mb-5">
            <NewBooking units={units} showImport={false} />
          </div>

          <Grid days={days} units={units} bookings={bookings} rates={rates} basePrice={basePrice} live={live} />
        </>
      )}
    </>
  );
}
