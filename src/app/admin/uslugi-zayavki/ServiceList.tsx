"use client";

import { useActionState } from "react";
import { changeServiceStatus, type BroniState } from "../broni/actions";
import type { PmsStatus } from "@/lib/db";
import type { ServiceRequestRow } from "@/lib/pms";

const STATUS_LABEL: Record<PmsStatus, string> = {
  new: "Заявка",
  confirmed: "Подтверждена",
  paid: "Оплачена",
  done: "Завершена",
  cancelled: "Отменена",
  declined: "Отказ",
};

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

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "—";

/**
 * Заявка на услугу.
 *
 * Ни номера, ни письма гостю: по услугам оператор подтверждает звонком — так он
 * и сказал. Остаётся статус и ответы на поля формы, какими бы они ни были: набор
 * полей оператор задаёт сам, и печатать их можно только как есть.
 */
function Card({ r }: { r: ServiceRequestRow }) {
  const [state, act, pending] = useActionState<BroniState, FormData>(changeServiceStatus, {});
  const closed = r.status === "done" || r.status === "cancelled" || r.status === "declined";
  const answers = Object.entries(r.answers ?? {});

  return (
    <li className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-serif text-xl font-bold text-[var(--ink)]">{r.guest_name}</span>
        <a href={`tel:${r.phone}`} className="font-semibold text-[var(--sun-dark)]">
          {r.phone}
        </a>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
        <span className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
          {r.service_name}
        </span>
        <span className="ml-auto text-xs text-[var(--muted)]">заявка №{r.id}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--ink)]">
        {r.visit_date && (
          <span>
            <b>Визит</b> {day(r.visit_date)}
          </span>
        )}
        {answers.map(([k, v]) => (
          <span key={k}>
            <b>{k}</b> {v}
          </span>
        ))}
      </div>

      {!closed && (
        <form action={act} className="mt-4 flex flex-wrap items-center gap-2 border-t border-[color:var(--line)] pt-4">
          <input type="hidden" name="id" value={r.id} />
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Статус</span>
          {NEXT[r.status].map((s) => (
            <button
              key={s}
              type="submit"
              name="status"
              value={s}
              disabled={pending}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                s === "paid"
                  ? "bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] text-[var(--on-accent)]"
                  : "border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          {state.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</span>}
          {state.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</span>}
        </form>
      )}
    </li>
  );
}

export function ServiceList({ items }: { items: ServiceRequestRow[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
        Заявок пока нет. Сюда попадают заявки с форм услуг, которые вы собрали в разделе «Услуги».
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <Card key={r.id} r={r} />
      ))}
    </ul>
  );
}
