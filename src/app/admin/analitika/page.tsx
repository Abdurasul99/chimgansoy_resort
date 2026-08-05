import Link from "next/link";
import { requestsBetween, storeConfigured, type RequestService } from "@/lib/requests-store";
import {
  NO_REVENUE_REASON,
  SERVICE_LABEL,
  humanDate,
  isoPlusDays,
  money,
  todayTashkent,
} from "@/lib/admin-format";
import { AdminHeading, StoreOffline } from "../AdminShell";

/**
 * Analytics by service.
 *
 * The honest scope, stated on the screen rather than buried: there is no
 * payment integration yet, so nothing here is money received. Every figure is
 * the sum of what the booking forms computed for requests the operator still
 * has to confirm. Labelling that column "выручка" would be the single most
 * misleading thing on this panel.
 *
 * GA4 and Metrica cannot answer this at all — they see a form submission, not
 * what it was worth. That is the whole reason this screen exists.
 */

type Props = { searchParams: Promise<{ d?: string }> };

const WINDOWS = [
  { id: "30", label: "30 дней", days: 30 },
  { id: "90", label: "90 дней", days: 90 },
  { id: "365", label: "Год", days: 365 },
] as const;

export default async function Analytics({ searchParams }: Props) {
  const { d } = await searchParams;

  if (!storeConfigured()) {
    return (
      <>
        <AdminHeading title="Аналитика" />
        <StoreOffline />
      </>
    );
  }

  const win = WINDOWS.find((w) => w.id === d) ?? WINDOWS[0];
  const today = todayTashkent();
  // Backwards from today: this screen is about what HAS happened, unlike the
  // journal, which mostly looks forward at who is coming.
  const from = isoPlusDays(today, -win.days);
  const rows = await requestsBetween(from, today);

  type Row = { service: RequestService; requests: number; revenue: number; guests: number; units: number };
  const by = new Map<RequestService, Row>();
  const byDay = new Map<string, number>();

  for (const r of rows) {
    const e = by.get(r.service) ?? { service: r.service, requests: 0, revenue: 0, guests: 0, units: 0 };
    e.requests += 1;
    e.revenue += r.total || 0;
    e.guests += (r.adults || 0) + (r.kids || 0) + (r.toddlers || 0);
    e.units += r.units || 0;
    by.set(r.service, e);
    byDay.set(r.date, (byDay.get(r.date) || 0) + 1);
  }

  const table = [...by.values()].sort((a, b) => b.revenue - a.revenue || b.requests - a.requests);
  const totalRequests = table.reduce((s, t) => s + t.requests, 0);
  const totalRevenue = table.reduce((s, t) => s + t.revenue, 0);
  const maxRevenue = Math.max(1, ...table.map((t) => t.revenue));
  const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <AdminHeading
        title="Аналитика по услугам"
        hint={`Визиты с ${humanDate(from)} по ${humanDate(today)}. Суммы посчитаны формами на сайте — это заявки, а не полученные деньги.`}
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {WINDOWS.map((w) => (
          <Link
            key={w.id}
            href={`/admin/analitika?d=${w.id}`}
            prefetch={false}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              w.id === win.id
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "border border-[color:var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {w.label}
          </Link>
        ))}
      </div>

      {totalRequests === 0 ? (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 text-sm leading-6 text-[var(--muted)]">
          За этот период заявок не было, считать нечего.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Всего заявок" value={String(totalRequests)} />
            <Stat label="На сумму" value={`${money(totalRevenue)} сум`} />
            <Stat
              label="Самый загруженный день"
              value={busiest ? humanDate(busiest[0]) : "—"}
              note={busiest ? `${busiest[1]} заявок на этот визит` : undefined}
            />
          </div>

          <div className="mt-8 grid gap-3">
            {table.map((t) => {
              const share = Math.round((t.revenue / maxRevenue) * 100);
              const reason = NO_REVENUE_REASON[t.service];
              return (
                <div key={t.service} className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-serif text-lg font-bold text-[var(--ink)]">
                      {SERVICE_LABEL[t.service] ?? t.service}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {t.requests} {t.requests === 1 ? "заявка" : "заявок"}
                      {t.guests ? ` · ${t.guests} гостей` : ""}
                      {t.units ? ` · ${t.units} единиц` : ""}
                    </span>
                    <span className="ml-auto font-serif text-xl font-bold tabular-nums text-[var(--ink)]">
                      {t.revenue ? `${money(t.revenue)} сум` : "—"}
                    </span>
                  </div>

                  {/* A bar rather than a chart library: one number per row, and
                      a dependency would be more code than the whole screen. */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--mist)]">
                    <div
                      className="h-full rounded-full bg-[var(--sun)]"
                      style={{ width: `${t.revenue ? Math.max(share, 2) : 0}%` }}
                    />
                  </div>

                  {reason && (
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Без суммы — {reason}.</p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[var(--mist)]/60 p-5 text-sm leading-6 text-[var(--muted)]">
            <b className="text-[var(--ink)]">Что это за цифры.</b> Каждая строка — заявки с сайта за
            период, посчитанные по тарифам, которые видел гость. Это <b>не</b> полученные деньги:
            оплата пока не подключена, и часть заявок отменяется на подтверждении. Google Analytics
            и Метрика этого не покажут вообще — они видят факт отправки формы, но не сумму.
          </p>
        </>
      )}
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold tabular-nums text-[var(--ink)]">{value}</p>
      {note && <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{note}</p>}
    </div>
  );
}
