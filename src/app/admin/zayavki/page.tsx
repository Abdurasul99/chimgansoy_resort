import Link from "next/link";
import { requestsBetween, storeConfigured, type StoredRequest } from "@/lib/requests-store";
import {
  SERVICE_LABEL,
  guestsPhrase,
  humanDate,
  humanDateTime,
  isoPlusDays,
  money,
  todayTashkent,
} from "@/lib/admin-format";
import { AdminHeading, StoreOffline } from "../AdminShell";

/**
 * The journal — every request over a chosen window of VISIT dates.
 *
 * Filtered by links rather than a form: there are four sensible windows, the
 * operator picks one, and a set of links keeps the whole screen a server
 * component with a shareable URL. A date-range picker here would be three
 * client components to save nobody any clicks.
 */

type Props = { searchParams: Promise<{ p?: string; s?: string }> };

const RANGES = [
  { id: "7", label: "Ближайшая неделя", from: 0, to: 7 },
  { id: "30", label: "Месяц вперёд", from: 0, to: 30 },
  { id: "past", label: "Прошедшие 30 дней", from: -30, to: -1 },
  { id: "all", label: "Всё", from: -365, to: 365 },
] as const;

export default async function RequestsJournal({ searchParams }: Props) {
  const { p, s } = await searchParams;

  if (!storeConfigured()) {
    return (
      <>
        <AdminHeading title="Заявки" />
        <StoreOffline />
      </>
    );
  }

  const range = RANGES.find((r) => r.id === p) ?? RANGES[1];
  const today = todayTashkent();
  const from = isoPlusDays(today, range.from);
  const to = isoPlusDays(today, range.to);

  const all = await requestsBetween(from, to);
  const rows = s ? all.filter((r) => r.service === s) : all;

  const services = [...new Set(all.map((r) => r.service))];

  return (
    <>
      <AdminHeading
        title="Заявки"
        hint={`Визиты с ${humanDate(from)} по ${humanDate(to)}. Сортировка — по времени подачи, новые сверху.`}
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <FilterLink key={r.id} href={`/admin/zayavki?p=${r.id}${s ? `&s=${s}` : ""}`} on={r.id === range.id}>
            {r.label}
          </FilterLink>
        ))}
      </div>

      {services.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <FilterLink href={`/admin/zayavki?p=${range.id}`} on={!s}>
            Все услуги
          </FilterLink>
          {services.map((svc) => (
            <FilterLink key={svc} href={`/admin/zayavki?p=${range.id}&s=${svc}`} on={s === svc}>
              {SERVICE_LABEL[svc] ?? svc}
            </FilterLink>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 text-sm leading-6 text-[var(--muted)]">
          За этот период заявок нет.{" "}
          <Link href="/admin/zayavki?p=all" prefetch={false} className="font-semibold text-[var(--accent-strong)]">
            Посмотреть за весь год
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--muted)]">
            {rows.length} {plural(rows.length, "заявка", "заявки", "заявок")}
          </p>
          <ul className="grid gap-3">
            {rows.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function FilterLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        on
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "border border-[color:var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </Link>
  );
}

function RequestCard({ r }: { r: StoredRequest }) {
  return (
    <li className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="font-serif text-lg font-bold text-[var(--ink)]">{r.name || "без имени"}</span>
        {/* A real tel: link — the operator calls these back from a phone. */}
        <a href={`tel:${r.phone}`} className="text-sm font-semibold text-[var(--accent-strong)]">
          {r.phone}
        </a>
        {r.email && <span className="text-sm text-[var(--muted)]">{r.email}</span>}
        <span className="rounded-full bg-[var(--mist)] px-2.5 py-0.5 text-xs font-bold">
          {SERVICE_LABEL[r.service] ?? r.service}
        </span>
        <span className="ml-auto text-xs text-[var(--muted)]">подана {humanDateTime(r.createdAt)}</span>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Field label="Визит" value={humanDate(r.date)} />
        {r.checkin && <Field label="Заезд" value={humanDate(r.checkin)} />}
        {r.checkout && <Field label="Выезд" value={humanDate(r.checkout)} />}
        {r.room && <Field label="Тип" value={r.room} />}
        <Field label="Гости" value={guestsPhrase(r)} />
        {r.units ? <Field label="Единиц" value={String(r.units)} /> : null}
        {r.tariff && <Field label="Тариф" value={r.tariff} />}
        {r.total > 0 && <Field label="Сумма" value={`${money(r.total)} сум`} strong />}
      </dl>

      {r.extras?.length > 0 && (
        <p className="mt-2 text-sm text-[var(--muted)]">Доп.: {r.extras.join(", ")}</p>
      )}
      {r.message && (
        <p className="mt-3 rounded-xl bg-[var(--mist)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
          {r.message}
        </p>
      )}
    </li>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</dt>
      <dd className={strong ? "font-bold tabular-nums text-[var(--ink)]" : "text-[var(--ink)]"}>{value}</dd>
    </div>
  );
}

/** 1 заявка / 2 заявки / 5 заявок — the same rule as ridesRu in lib/tariff.ts. */
function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 14) return many;
  switch (abs % 10) {
    case 1:
      return one;
    case 2:
    case 3:
    case 4:
      return few;
    default:
      return many;
  }
}
