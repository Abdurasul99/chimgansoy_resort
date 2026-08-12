"use client";

import { useActionState } from "react";
import { saveRate, type BroniState } from "../broni/actions";
import type { PmsStatus } from "@/lib/db";
import type { BookingRow, RateRow, UnitRow } from "@/lib/pms";

/**
 * Шахматка: единицы по строкам, дни по столбцам.
 *
 * Таблица, а не сетка из блоков: строка «домик» и столбец «день» — это ровно
 * то, что таблица описывает, и браузер сам держит их выровненными при
 * горизонтальной прокрутке. Своя раскладка на flex рассыпается на первом же
 * домике с длинным именем.
 */
const TONE: Record<PmsStatus, string> = {
  new: "bg-[var(--surface-warm)] text-[var(--ink)] border-[var(--line-strong)]",
  confirmed: "bg-[var(--sun)]/35 text-[var(--sun-dark)] border-[var(--sun)]",
  paid: "bg-[var(--green,#3f7d52)] text-white border-[var(--green,#3f7d52)]",
  done: "bg-[var(--mist)] text-[var(--muted)] border-[var(--line)]",
  cancelled: "bg-transparent text-[var(--muted)] border-[var(--line)]",
  declined: "bg-transparent text-[var(--muted)] border-[var(--line)]",
};

const ROOM_LABEL: Record<string, string> = { glamping: "Глэмпинг A-frame", cottage: "Шале" };
const money = (n: number) => n.toLocaleString("ru-RU").replaceAll(",", " ");
const input =
  "rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";

/** Занимает ли бронь этот день: выезд — день освобождения, он уже свободен. */
function covers(b: BookingRow, day: string): boolean {
  const out = b.checkout ?? b.checkin;
  return day >= b.checkin && (day < out || (b.checkout === null && day === b.checkin));
}

export function Grid({
  days,
  units,
  bookings,
  rates,
  basePrice,
}: {
  days: string[];
  units: UnitRow[];
  bookings: BookingRow[];
  rates: RateRow[];
  /** Обычная цена из прайса — показывается, когда на дату нет своей. */
  basePrice: Record<string, number>;
}) {
  const [state, act, pending] = useActionState<BroniState, FormData>(saveRate, {});
  const rateOf = (slug: string, day: string) => rates.find((r) => r.room_slug === slug && r.day === day)?.price;
  const groups = ["glamping", "cottage"].filter((s) => units.some((u) => u.room_slug === s));

  const dayLabel = (d: string) => {
    const dt = new Date(`${d}T12:00:00`);
    return { num: dt.getDate(), dow: dt.toLocaleDateString("ru-RU", { weekday: "short" }), weekend: [0, 5, 6].includes(dt.getDay()) };
  };

  return (
    <div className="space-y-6">
      {/* Цена на диапазон: «с 1 по 30 сентября столько» — так о ценах и думают. */}
      <form action={act} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[color:var(--line)] p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Тип</span>
          <select name="room" className={input} defaultValue="glamping">
            {groups.map((s) => (
              <option key={s} value={s}>
                {ROOM_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">С</span>
          <input name="from" type="date" required defaultValue={days[0]} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">По</span>
          <input name="to" type="date" required defaultValue={days[days.length - 1]} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Цена за ночь <span className="font-normal normal-case">— пусто, чтобы вернуть обычную</span>
          </span>
          <input name="price" type="number" min={0} placeholder="напр. 1800000" className={`${input} w-48`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-2.5 text-sm font-extrabold text-[var(--on-accent)] transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Задать цену"}
        </button>
        {state.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</span>}
        {state.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</span>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--line)]">
        <table className="w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[var(--surface-warm)] px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Домик
              </th>
              {days.map((d) => {
                const { num, dow, weekend } = dayLabel(d);
                return (
                  <th
                    key={d}
                    className={`min-w-[46px] px-1 py-2 text-center text-xs font-semibold ${
                      weekend ? "bg-[var(--sun)]/12 text-[var(--sun-dark)]" : "bg-[var(--surface-warm)] text-[var(--muted)]"
                    }`}
                  >
                    <div>{num}</div>
                    <div className="text-[10px] font-normal">{dow}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map((slug) => (
              <>
                {/* Строка цен — над блоком своего типа: цена у глэмпинга и шале
                    разная, и одна общая строка врала бы про половину сетки. */}
                <tr key={`${slug}-rates`}>
                  <th className="sticky left-0 z-10 bg-[var(--mist)] px-4 py-1.5 text-left text-xs font-bold text-[var(--ink)]">
                    {ROOM_LABEL[slug] ?? slug} · цена
                  </th>
                  {days.map((d) => {
                    const own = rateOf(slug, d);
                    return (
                      <td
                        key={d}
                        title={own ? "Своя цена на эту дату" : "Обычная цена из прайса"}
                        className={`px-1 py-1.5 text-center text-[10px] ${
                          own ? "bg-[var(--sun)]/20 font-bold text-[var(--sun-dark)]" : "text-[var(--muted)]"
                        }`}
                      >
                        {Math.round((own ?? basePrice[slug] ?? 0) / 1000)}к
                      </td>
                    );
                  })}
                </tr>

                {units
                  .filter((u) => u.room_slug === slug)
                  .map((u) => (
                    <tr key={u.id} className="border-t border-[color:var(--line)]">
                      <th className="sticky left-0 z-10 bg-[var(--paper)] px-4 py-2 text-left font-semibold text-[var(--ink)]">
                        {u.id}
                      </th>
                      {days.map((d) => {
                        const b = bookings.find((x) => x.unit_id === u.id && covers(x, d));
                        if (!b) return <td key={d} className="border-l border-[color:var(--line)] px-1 py-2" />;
                        const first = d === b.checkin;
                        return (
                          <td
                            key={d}
                            title={`${b.guest_name} · ${b.phone} · ${b.checkin}${b.checkout ? ` → ${b.checkout}` : ""} · ${money(b.total)} сум`}
                            className={`border-l px-1 py-2 text-center text-[10px] font-bold ${TONE[b.status]}`}
                          >
                            {first ? b.guest_name.split(" ")[0].slice(0, 6) : "·"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--surface-warm)] align-middle ring-1 ring-[var(--line-strong)]" />Заявка</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--sun)]/60 align-middle" />Подтверждена</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--green,#3f7d52)] align-middle" />Оплачена</span>
        <span>Пустая клетка — свободно. Наведите на бронь, чтобы увидеть телефон и сумму.</span>
      </div>
    </div>
  );
}
