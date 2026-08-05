import Link from "next/link";
import { recentRequests, serviceTotals, storeConfigured } from "@/lib/requests-store";
import {
  SERVICE_LABEL,
  guestsPhrase,
  humanDate,
  humanDateTime,
  isoPlusDays,
  money,
  todayTashkent,
} from "@/lib/admin-format";
import { AdminHeading, StoreOffline } from "./AdminShell";

/**
 * The summary screen: what has come in lately, and what it adds up to.
 *
 * Thirty days back and thirty forward, by VISIT date — the archive files a
 * request under the day of the visit, and the operator's question is "who is
 * coming", not "who typed something last week". The two are very different for
 * a resort where a booking lands weeks before the stay.
 */
export default async function AdminDashboard() {
  if (!storeConfigured()) {
    return (
      <>
        <AdminHeading title="Сводка" />
        <StoreOffline />
      </>
    );
  }

  const today = todayTashkent();
  const from = isoPlusDays(today, -30);
  const to = isoPlusDays(today, 30);

  const [totals, recent] = await Promise.all([serviceTotals(from, to), recentRequests(8)]);

  const requests = totals.reduce((s, t) => s + t.requests, 0);
  const revenue = totals.reduce((s, t) => s + t.revenue, 0);
  const guests = totals.reduce((s, t) => s + t.guests, 0);

  return (
    <>
      <AdminHeading
        title="Сводка"
        hint={`Визиты с ${humanDate(from)} по ${humanDate(to)} — 30 дней назад и 30 вперёд.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Заявок" value={String(requests)} />
        <Stat label="Гостей" value={String(guests)} />
        <Stat
          label="Сумма по заявкам"
          value={`${money(revenue)} сум`}
          note="посчитано формами, деньги ещё не получены"
        />
      </div>

      {requests === 0 ? (
        <p className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 text-sm leading-6 text-[var(--muted)]">
          За этот период заявок нет. Как только гость отправит форму на сайте, она появится здесь
          и одновременно уйдёт в Telegram.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)] text-left text-[var(--muted)]">
                <th className="px-5 py-3 font-semibold">Услуга</th>
                <th className="px-5 py-3 text-right font-semibold">Заявок</th>
                <th className="px-5 py-3 text-right font-semibold">Гостей</th>
                <th className="px-5 py-3 text-right font-semibold">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.service} className="border-b border-[color:var(--line)] last:border-0">
                  <td className="px-5 py-3 font-semibold text-[var(--ink)]">
                    {SERVICE_LABEL[t.service] ?? t.service}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.requests}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-[var(--muted)]">{t.guests || "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {t.revenue ? `${money(t.revenue)} сум` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Последние заявки</h2>
        <Link href="/admin/zayavki" prefetch={false} className="text-sm font-semibold text-[var(--accent-strong)]">
          Все заявки →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">Пока ничего не приходило.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {recent.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-5 py-3"
            >
              <span className="text-sm font-bold text-[var(--ink)]">{r.name || "без имени"}</span>
              <a href={`tel:${r.phone}`} className="text-sm text-[var(--accent-strong)]">
                {r.phone}
              </a>
              <span className="rounded-full bg-[var(--mist)] px-2.5 py-0.5 text-xs font-bold">
                {SERVICE_LABEL[r.service] ?? r.service}
              </span>
              <span className="text-xs text-[var(--muted)]">визит {humanDate(r.date)}</span>
              <span className="text-xs text-[var(--muted)]">{guestsPhrase(r)}</span>
              {r.total > 0 && (
                <span className="text-sm font-semibold tabular-nums">{money(r.total)} сум</span>
              )}
              <span className="ml-auto text-xs text-[var(--muted)]">{humanDateTime(r.createdAt)}</span>
            </li>
          ))}
        </ul>
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
