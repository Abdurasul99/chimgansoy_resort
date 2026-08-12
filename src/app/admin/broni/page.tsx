import { AdminHeading } from "../AdminShell";
import { BookingsList } from "./BookingsList";
import { NewBooking } from "./NewBooking";
import { listBookings, listUnits, type BookingRow, type UnitRow } from "@/lib/pms";

/**
 * Брони на проживание — то, чем оператор работает каждый день.
 *
 * Только глэмпинг и шале: дневные услуги живут на своём экране, потому что у
 * них нет ни номера, ни выезда, и мешать их в один список значило бы половину
 * колонок держать пустыми.
 *
 * Читает всегда свежее: оператор смотрит на этот экран, чтобы принять решение
 * о деньгах, и кешированный список тут недопустим.
 */
export const dynamic = "force-dynamic";
// Перенос читает сотню заявок из Blob по одной — это дольше, чем действие
// живёт по умолчанию, и первая попытка молча оборвалась на середине.
export const maxDuration = 300;

/** Окно по датам заезда. По умолчанию — от вчера на три месяца вперёд. */
const RANGES = [
  { id: "30", label: "Месяц вперёд", from: -1, to: 30 },
  { id: "90", label: "Три месяца", from: -1, to: 90 },
  { id: "past", label: "Прошедшие 30 дней", from: -30, to: -1 },
  { id: "all", label: "Всё", from: -365, to: 365 },
] as const;

function shift(days: number): string {
  const d = new Date(Date.now() + 5 * 3600_000 + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const range = RANGES.find((r) => r.id === p) ?? RANGES[1];

  let items: BookingRow[] = [];
  let units: UnitRow[] = [];
  let error: string | null = null;
  try {
    [items, units] = await Promise.all([listBookings(shift(range.from), shift(range.to)), listUnits()]);
  } catch (e) {
    // База может быть недоступна — сказать об этом прямо лучше, чем показать
    // пустой список, который оператор прочитает как «броней нет».
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  const live = items.filter((b) => b.status === "new" || b.status === "confirmed");

  return (
    <>
      <AdminHeading
        title="Брони"
        hint="Глэмпинг и шале. Закрепите номер, отметьте оплату — гость получит подтверждение на почту, если он её оставил."
      />

      {error ? (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
          Не удалось прочитать базу: {error}
        </p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <a
                key={r.id}
                href={`/admin/broni?p=${r.id}`}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  r.id === range.id
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[color:var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--sun)]"
                }`}
              >
                {r.label}
              </a>
            ))}
          </div>

          <NewBooking units={units} />

          <p className="mb-4 text-sm text-[var(--muted)]">
            {items.length} броней · {live.length} в работе
          </p>

          <BookingsList items={items} units={units} />
        </>
      )}
    </>
  );
}
