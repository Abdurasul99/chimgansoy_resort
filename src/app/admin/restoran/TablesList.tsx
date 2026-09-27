"use client";

import { useActionState, type FormEvent } from "react";
import type { StatusLogEntry, TableRequest, TableStatus } from "@/lib/restaurant/model";
import {
  TABLE_ACTION_LABEL,
  TABLE_REASONS,
  TABLE_REASON_LABEL,
  TABLE_STATUS_LABEL,
  TABLE_STATUS_TONE,
  stamp,
} from "@/lib/restaurant/labels";
import { TABLE_TRANSITIONS, addDaysISO } from "@/lib/restaurant/rules";
import { changeTableStatus, resendTable, type ActionState } from "./actions";
import { submitKeeping } from "./form-hooks";
import { History, Result, chip, dangerBtn, fieldBase, goldBtn, lineBtn, linkBtn } from "./ui";

const statusLabel = (s: string) => TABLE_STATUS_LABEL[s as TableStatus] ?? s;

const WEEKDAY = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

/** «27.09.2026, воскресенье» из «2026-09-27». */
function visitDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return `${m[3]}.${m[2]}.${m[1]}, ${WEEKDAY[day]}`;
}

/** Подтверждение перед отказом или отменой: кнопку жмут с телефона, промахнуться легко. */
function confirmReason(e: FormEvent<HTMLFormElement>, number: string): boolean {
  const to = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
  const question = to === "declined" ? `Отказать в брони #${number}?` : `Отменить бронь #${number}?`;
  return confirm(`${question} Вернуть её будет нельзя.`);
}

/**
 * Бронь стола. Отказ и отмена — одна форма с двумя кнопками: причина у них
 * из одного списка, а разница — кто передумал. «Отказать» — ресторан не может
 * принять, «Отменить» — гость или обстоятельства после подтверждения.
 */
function TableCard({
  t,
  log,
  highlight,
  today,
}: {
  t: TableRequest;
  log: StatusLogEntry[];
  highlight: boolean;
  today: string;
}) {
  const [st, setSt, stPending] = useActionState<ActionState, FormData>(changeTableStatus, {});
  const [tg, setTg, tgPending] = useActionState<ActionState, FormData>(resendTable, {});

  const next = TABLE_TRANSITIONS[t.status] ?? [];
  const forward = next.filter((s) => s === "confirmed" || s === "done");
  const refusals = next.filter((s) => s === "declined" || s === "cancelled");
  const tel = t.phone.replace(/[^\d+]/g, "");
  const when = t.date === today ? "сегодня" : t.date === addDaysISO(today, 1) ? "завтра" : null;

  return (
    <li
      id={`t-${t.id}`}
      className={`scroll-mt-28 rounded-2xl border bg-[var(--paper)] p-4 sm:p-5 ${
        highlight ? "border-[var(--sun)] ring-2 ring-[var(--sun)]/50" : "border-[color:var(--line)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xl font-bold text-[var(--ink)]">#{t.number}</span>
        <span className={`${chip} ${TABLE_STATUS_TONE[t.status] ?? ""}`}>{statusLabel(t.status)}</span>
        {when && (
          <span
            className={`${chip} ${
              when === "сегодня" ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--mist)] text-[var(--ink)]"
            }`}
          >
            {when}
          </span>
        )}
        {t.isTest && <span className={`${chip} bg-[var(--sun)]/25 text-[var(--sun-dark)]`}>ТЕСТ</span>}
        <span className="ml-auto text-xs text-[var(--muted)]">заявка {stamp(t.createdAt)}</span>
      </div>

      <p className="mt-3 text-lg font-bold text-[var(--ink)]">
        {visitDate(t.date)} · {t.time}
      </p>
      <p className="mt-0.5 text-sm text-[var(--ink)]">
        {t.adults} взр.{t.kids ? ` + ${t.kids} дет.` : ""}
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-base font-semibold text-[var(--ink)]">{t.name || "без имени"}</span>
        <a href={`tel:${tel}`} className="text-base font-bold text-[var(--sun-dark)] underline-offset-2 hover:underline">
          {t.phone}
        </a>
      </div>

      {t.comment && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-[var(--surface-warm)] p-3 text-sm text-[var(--ink)]">
          {t.comment}
        </p>
      )}
      {(t.status === "declined" || t.status === "cancelled") && t.cancelReason && (
        <p className="mt-3 text-sm text-[var(--rose,#b4413c)]">
          <b>Причина:</b> {t.cancelReason}
        </p>
      )}

      <p className="mt-3 text-xs text-[var(--muted)]">
        с сайта · язык гостя: {t.locale}
        {t.source ? ` · пришёл из: ${t.source}` : ""}
        {t.page ? ` · страница: ${t.page}` : ""}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {t.notifiedAt ? (
          <span className="font-semibold text-[var(--green,#3f7d52)]">✓ в Telegram · {stamp(t.notifiedAt)}</span>
        ) : (
          <>
            <span className="font-semibold text-[var(--rose,#b4413c)]">
              {t.tgSent > 0 ? "⚠ в Telegram дошло не во все чаты" : "⚠ не доставлено в Telegram"}
            </span>
            <form action={setTg}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" disabled={tgPending} className={`${linkBtn} min-h-8`}>
                {tgPending ? "Отправляем…" : "Отправить ещё раз"}
              </button>
            </form>
          </>
        )}
        {!t.notifiedAt && <Result state={tg} pending={tgPending} className="" />}
      </div>

      {next.length > 0 && (
        <div className="mt-4 space-y-4 border-t border-[color:var(--line)] pt-4">
          {forward.length > 0 && (
            <form action={setSt} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={t.id} />
              {forward.map((s) => (
                <button
                  key={s}
                  type="submit"
                  name="status"
                  value={s}
                  disabled={stPending}
                  className={s === "confirmed" ? goldBtn : lineBtn}
                >
                  {TABLE_ACTION_LABEL[s] ?? statusLabel(s)}
                </button>
              ))}
            </form>
          )}

          {refusals.length > 0 && (
            <form onSubmit={submitKeeping(setSt, (e) => confirmReason(e, t.number))} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={t.id} />
              <select
                name="reason"
                required
                defaultValue=""
                aria-label="Причина"
                className={`${fieldBase} min-h-11 max-w-full`}
              >
                <option value="" disabled>
                  Причина…
                </option>
                {TABLE_REASONS.map((r) => (
                  <option key={r} value={TABLE_REASON_LABEL[r]}>
                    {TABLE_REASON_LABEL[r]}
                  </option>
                ))}
              </select>
              <input
                name="reasonText"
                maxLength={300}
                placeholder="Подробнее — по желанию"
                aria-label="Подробнее о причине"
                className={`${fieldBase} min-h-11 min-w-0 flex-1 basis-48`}
              />
              {refusals.map((s) => (
                <button key={s} type="submit" name="status" value={s} disabled={stPending} className={dangerBtn}>
                  {s === "declined" ? TABLE_ACTION_LABEL.declined : "Отменить бронь"}
                </button>
              ))}
            </form>
          )}
          <Result state={st} pending={stPending} />
        </div>
      )}

      <History log={log} label={statusLabel} />
    </li>
  );
}

export function TablesList({
  tables,
  histories,
  highlight,
  today,
  filterLabel,
}: {
  tables: TableRequest[];
  histories: Record<string, StatusLogEntry[]>;
  highlight: number | null;
  today: string;
  filterLabel: string;
}) {
  if (tables.length === 0) {
    return (
      <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
        В фильтре «{filterLabel}» броней нет. Новая бронь с сайта появится здесь и в Telegram
        одновременно.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {tables.map((t) => (
        <TableCard
          key={t.id}
          t={t}
          log={histories[String(t.id)] ?? []}
          highlight={highlight === t.id}
          today={today}
        />
      ))}
    </ul>
  );
}
