"use client";

import { useActionState } from "react";
import { changeMoney, changeStatus, changeUnit, removeBooking, type BroniState } from "./actions";
import type { PmsStatus } from "@/lib/db";
import type { BookingRow, UnitRow } from "@/lib/pms";

const STATUS_LABEL: Record<PmsStatus, string> = {
  new: "Заявка",
  confirmed: "Подтверждена",
  paid: "Оплачена",
  done: "Завершена",
  cancelled: "Отменена",
  declined: "Отказ",
};

/** Цвет статуса — чтобы оператор видел состояние списка, не читая слова. */
const STATUS_TONE: Record<PmsStatus, string> = {
  new: "bg-[var(--surface-warm)] text-[var(--ink)]",
  confirmed: "bg-[var(--sun)]/25 text-[var(--sun-dark)]",
  paid: "bg-[var(--green,#3f7d52)]/15 text-[var(--green,#3f7d52)]",
  done: "bg-[var(--mist)] text-[var(--muted)]",
  cancelled: "bg-[var(--line)] text-[var(--muted)]",
  declined: "bg-[var(--rose,#b4413c)]/12 text-[var(--rose,#b4413c)]",
};

const NEXT: Record<PmsStatus, PmsStatus[]> = {
  new: ["confirmed", "declined", "cancelled"],
  confirmed: ["paid", "cancelled", "declined"],
  paid: ["done", "cancelled"],
  done: [],
  cancelled: [],
  declined: [],
};

const ROOM_LABEL: Record<string, string> = {
  glamping: "Глэмпинг A-frame",
  cottage: "Шале",
  pool: "Бассейн",
  "bungalow-small": "Бунгало Standard",
  "bungalow-large": "Бунгало Family",
};

const input =
  "rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const money = (n: number) => n.toLocaleString("ru-RU").replaceAll(",", " ");
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "—";

function Note({ state }: { state: BroniState }) {
  if (state.error) return <p className="mt-2 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>;
  if (state.ok) return <p className="mt-2 text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</p>;
  return null;
}

/**
 * Одна бронь — одна карточка со всем, что оператор с ней делает.
 *
 * Три отдельные формы вместо одной: статус, номер и деньги меняются в разные
 * моменты и по разным причинам. Общая форма означала бы, что смена статуса
 * тащит за собой суммы, которые оператор в этот момент не трогал.
 */
function Card({ b, units }: { b: BookingRow; units: UnitRow[] }) {
  const [st, setSt, stPending] = useActionState<BroniState, FormData>(changeStatus, {});
  const [un, setUn, unPending] = useActionState<BroniState, FormData>(changeUnit, {});
  const [mo, setMo, moPending] = useActionState<BroniState, FormData>(changeMoney, {});
  const [rm, setRm, rmPending] = useActionState<BroniState, FormData>(removeBooking, {});

  const free = units.filter((u) => u.room_slug === b.room_slug && u.active);
  const closed = b.status === "done" || b.status === "cancelled" || b.status === "declined";

  return (
    <li className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-serif text-xl font-bold text-[var(--ink)]">{b.guest_name}</span>
        <a href={`tel:${b.phone}`} className="font-semibold text-[var(--sun-dark)]">
          {b.phone}
        </a>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[b.status]}`}>
          {STATUS_LABEL[b.status]}
        </span>
        <span className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
          {ROOM_LABEL[b.room_slug] ?? b.room_slug}
        </span>
        {b.unit_id && (
          <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-bold text-white">{b.unit_id}</span>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs text-[var(--muted)]">
          заявка №{b.id}
          {/* Удаление — для опечаток и дублей. Для «гость передумал» есть
              статус «Отмена»: он сохраняет запись, а это стирает. */}
          <form action={setRm} onSubmit={(e) => { if (!confirm("Удалить бронь без следа? Для отказа гостя есть статус «Отмена».")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={b.id} />
            <button type="submit" disabled={rmPending} className="underline underline-offset-2 transition hover:text-[var(--rose,#b4413c)] disabled:opacity-50">
              удалить
            </button>
          </form>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--ink)]">
        <span>
          <b>Заезд</b> {day(b.checkin)}
          {b.checkout ? ` → ${day(b.checkout)}` : ""}
        </span>
        <span>
          <b>Гости</b> {b.adults} взр{b.kids > 0 ? ` · ${b.kids} дет` : ""}
        </span>
        {b.email && (
          <span>
            <b>Почта</b> {b.email}
          </span>
        )}
        <span>
          <b>Сумма</b> {money(b.total)} · внесено {money(b.paid)}
        </span>
      </div>

      <Note state={rm} />

      {b.comment && (
        <p className="mt-3 rounded-xl bg-[var(--surface-warm)] p-3 text-sm text-[var(--ink)]">{b.comment}</p>
      )}

      {!closed && (
        <div className="mt-4 space-y-3 border-t border-[color:var(--line)] pt-4">
          {/* Номер. Стоит выше статусов: «оплачена» без него панель не примет. */}
          <form action={setUn} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={b.id} />
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Номер</span>
            <select name="unit" defaultValue={b.unit_id ?? ""} className={input}>
              <option value="">— не закреплён —</option>
              {free.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} · {u.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={unPending}
              className="rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-50"
            >
              {unPending ? "Сохраняем…" : "Закрепить"}
            </button>
            <Note state={un} />
          </form>

          {/* Деньги */}
          <form action={setMo} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={b.id} />
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Сумма</span>
            <input name="total" type="number" min={0} defaultValue={b.total} className={`${input} w-36`} />
            <span className="text-xs text-[var(--muted)]">внесено</span>
            <input name="paid" type="number" min={0} defaultValue={b.paid} className={`${input} w-36`} />
            <button
              type="submit"
              disabled={moPending}
              className="rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-50"
            >
              {moPending ? "Сохраняем…" : "Сохранить"}
            </button>
            <Note state={mo} />
          </form>

          {/* Статусы */}
          <form action={setSt} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={b.id} />
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Статус</span>
            {NEXT[b.status].map((s) => (
              <button
                key={s}
                type="submit"
                name="status"
                value={s}
                disabled={stPending}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                  s === "paid"
                    ? "bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] text-[var(--on-accent)]"
                    : "border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)]"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            <Note state={st} />
          </form>
        </div>
      )}
    </li>
  );
}

export function BookingsList({ items, units }: { items: BookingRow[]; units: UnitRow[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
        Броней за это окно нет. Заявки с сайта попадают сюда сразу после отправки.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((b) => (
        <Card key={b.id} b={b} units={units} />
      ))}
    </ul>
  );
}
