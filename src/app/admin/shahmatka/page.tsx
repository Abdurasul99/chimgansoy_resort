import Link from "next/link";
import { AdminHeading } from "../AdminShell";
import { Grid } from "./Grid";
import { listRates, listUnits, occupancy, type BookingRow, type RateRow, type UnitRow } from "@/lib/pms";

/**
 * Шахматка: кто где стоит и почём.
 *
 * Тридцать дней в окне — больше не помещается на экран даже с прокруткой, а
 * меньше не даёт увидеть месяц целиком, ради чего сетку и открывают.
 */
export const dynamic = "force-dynamic";
const DAYS = 30;

function shift(days: number): string {
  return new Date(Date.now() + 5 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10);
}

export default async function ShahmatkaPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
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
  let error: string | null = null;
  try {
    [units, bookings, rates] = await Promise.all([listUnits(), occupancy(from, to), listRates(from, to)]);
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
  const basePrice: Record<string, number> = { glamping: 1_500_000, cottage: 3_000_000 };

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
            <Link href={nav(-DAYS)} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--sun)]">← назад</Link>
            <Link href="/admin/shahmatka" className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--sun)]">сегодня</Link>
            <Link href={nav(DAYS)} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--sun)]">вперёд →</Link>
            <span className="text-sm text-[var(--muted)]">{from} — {to}</span>
          </div>
          <Grid days={days} units={units} bookings={bookings} rates={rates} basePrice={basePrice} />
        </>
      )}
    </>
  );
}
