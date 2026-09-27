"use client";

import { useActionState } from "react";
import { money } from "@/lib/tariff";
import { CANCEL_REASONS, type Order, type OrderStatus, type StatusLogEntry } from "@/lib/restaurant/model";
import {
  CANCEL_REASON_LABEL,
  MODE_EMOJI,
  MODE_LABEL,
  ORDER_ACTION_LABEL,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  UNIT_LABEL,
  stamp,
  timeLabel,
} from "@/lib/restaurant/labels";
import { ORDER_TRANSITIONS } from "@/lib/restaurant/rules";
import { changeOrderStatus, resendOrder, setConfirmedTime, setFee, setPayment, type ActionState } from "./actions";
import { submitKeeping } from "./form-hooks";
import { History, Result, chip, dangerBtn, fieldBase, goldBtn, lineBtn, linkBtn, miniLabel } from "./ui";

const statusLabel = (s: string) => ORDER_STATUS_LABEL[s as OrderStatus] ?? s;

function place(o: Order): string {
  const d = o.details ?? {};
  if (o.mode === "room") {
    const unit = d.unitType ? UNIT_LABEL[d.unitType] : "";
    return [unit, d.unitNo ? `№${d.unitNo}` : ""].filter(Boolean).join(" ");
  }
  if (o.mode === "delivery") return [d.locality, d.address].filter(Boolean).join(", ");
  return "";
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</dt>
      <dd className={strong ? "font-bold text-[var(--ink)]" : "text-[var(--ink)]"}>{value}</dd>
    </div>
  );
}

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? "text-base font-bold" : ""}`}>
      <span className={strong ? "text-[var(--ink)]" : "text-[var(--muted)]"}>{label}</span>
      <span className="tabular-nums text-[var(--ink)]">{value}</span>
    </div>
  );
}

/**
 * Один заказ — одна карточка со всем, что с ним делают.
 *
 * Статус, время, оплата и повторная отправка — отдельные формы: они меняются
 * в разные моменты, и нажатие «Оплачен» не должно тащить за собой поле
 * времени, которое человек начал править и бросил. Отмена — та же форма
 * статуса, но с обязательной причиной: её ТЗ требует сохранять всегда.
 */
function OrderCard({ o, log, highlight }: { o: Order; log: StatusLogEntry[]; highlight: boolean }) {
  const [st, setSt, stPending] = useActionState<ActionState, FormData>(changeOrderStatus, {});
  const [tm, setTm, tmPending] = useActionState<ActionState, FormData>(setConfirmedTime, {});
  const [pay, setPay, payPending] = useActionState<ActionState, FormData>(setPayment, {});
  const [tg, setTg, tgPending] = useActionState<ActionState, FormData>(resendOrder, {});
  const [fe, setFe, fePending] = useActionState<ActionState, FormData>(setFee, {});

  const next = ORDER_TRANSITIONS[o.status] ?? [];
  const forward = next.filter((s) => s !== "cancelled");
  const canCancel = next.includes("cancelled");
  const closed = next.length === 0;
  const paid = o.paymentStatus === "paid";
  const where = place(o);
  const tel = o.phone.replace(/[^\d+]/g, "");
  const feeLabel = o.mode === "delivery" ? "Доставка" : o.mode === "room" ? "Подача в номер" : null;
  const feeText = o.feePending ? "уточнить у гостя" : o.fee ? `${money(o.fee)} сум` : "бесплатно";

  return (
    <li
      id={`o-${o.id}`}
      className={`scroll-mt-28 rounded-2xl border bg-[var(--paper)] p-4 sm:p-5 ${
        highlight ? "border-[var(--sun)] ring-2 ring-[var(--sun)]/50" : "border-[color:var(--line)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xl font-bold text-[var(--ink)]">#{o.number}</span>
        <span className={`${chip} bg-[var(--mist)] text-[var(--ink)]`}>
          {MODE_EMOJI[o.mode]} {MODE_LABEL[o.mode] ?? o.mode}
        </span>
        <span className={`${chip} ${ORDER_STATUS_TONE[o.status] ?? ""}`}>{statusLabel(o.status)}</span>
        {o.isTest && <span className={`${chip} bg-[var(--sun)]/25 text-[var(--sun-dark)]`}>ТЕСТ</span>}
        <span className="ml-auto text-xs text-[var(--muted)]">{stamp(o.createdAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-base font-semibold text-[var(--ink)]">{o.name || "без имени"}</span>
        {/* Звонок гостю — первое, что делают с новым заказом. */}
        <a href={`tel:${tel}`} className="text-base font-bold text-[var(--sun-dark)] underline-offset-2 hover:underline">
          {o.phone}
        </a>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {where && <Field label={o.mode === "room" ? "Домик" : "Адрес"} value={where} />}
        {o.details?.guests ? <Field label="Гостей" value={String(o.details.guests)} /> : null}
        <Field label={o.mode === "preorder" ? "К визиту" : "Желаемое время"} value={timeLabel(o.desiredTime)} />
        {o.confirmedTime && <Field label="Подтверждено на" value={o.confirmedTime} strong />}
      </dl>

      <ul className="mt-4 divide-y divide-[color:var(--line)] rounded-xl border border-[color:var(--line)] bg-[var(--surface)] text-sm">
        {o.items.map((i, idx) => (
          <li key={`${i.dishId}-${idx}`} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <span className="min-w-0 text-[var(--ink)]">
              <b className="tabular-nums">{i.qty} ×</b> {i.title}
              {i.portion && <span className="text-[var(--muted)]"> ({i.portion})</span>}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--ink)]">{money(i.qty * i.price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 text-sm">
        <Sum label="Блюда" value={`${money(o.subtotal)} сум`} />
        {feeLabel && <Sum label={feeLabel} value={feeText} />}
        <Sum label="Итого" value={`${money(o.total)} сум${o.feePending ? " + сбор" : ""}`} strong />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted)]">Оплата</span>
          <span
            className={`${chip} ${
              paid
                ? "bg-[var(--green,#3f7d52)]/15 text-[var(--green,#3f7d52)]"
                : "bg-[var(--mist)] text-[var(--muted)]"
            }`}
          >
            {paid ? "оплачен" : "не оплачен"}
          </span>
        </div>
      </div>

      {o.comment && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-[var(--surface-warm)] p-3 text-sm text-[var(--ink)]">
          {o.comment}
        </p>
      )}
      {o.status === "cancelled" && o.cancelReason && (
        <p className="mt-3 text-sm text-[var(--rose,#b4413c)]">
          <b>Причина отмены:</b> {o.cancelReason}
        </p>
      )}

      <p className="mt-3 text-xs text-[var(--muted)]">
        с сайта · язык гостя: {o.locale}
        {o.source ? ` · пришёл из: ${o.source}` : ""}
        {o.page ? ` · страница: ${o.page}` : ""}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {o.notifiedAt ? (
          <span className="font-semibold text-[var(--green,#3f7d52)]">✓ в Telegram · {stamp(o.notifiedAt)}</span>
        ) : (
          <>
            <span className="font-semibold text-[var(--rose,#b4413c)]">
              {o.tgSent > 0 ? "⚠ в Telegram дошло не во все чаты" : "⚠ не доставлено в Telegram"}
            </span>
            <form action={setTg}>
              <input type="hidden" name="id" value={o.id} />
              <button type="submit" disabled={tgPending} className={`${linkBtn} min-h-8`}>
                {tgPending ? "Отправляем…" : "Отправить ещё раз"}
              </button>
            </form>
          </>
        )}
        {!o.notifiedAt && <Result state={tg} pending={tgPending} className="" />}
      </div>

      {!closed && (
        <div className="mt-4 space-y-4 border-t border-[color:var(--line)] pt-4">
          {forward.length > 0 && (
            <form action={setSt} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={o.id} />
              {forward.map((s, i) => (
                <button
                  key={s}
                  type="submit"
                  name="status"
                  value={s}
                  disabled={stPending}
                  className={i === 0 ? goldBtn : lineBtn}
                >
                  {ORDER_ACTION_LABEL[s] ?? statusLabel(s)}
                </button>
              ))}
            </form>
          )}

          <form onSubmit={submitKeeping(setTm)} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={o.id} />
            <span className={miniLabel}>Время</span>
            <input
              name="time"
              defaultValue={o.confirmedTime}
              placeholder="19:30"
              maxLength={40}
              autoComplete="off"
              aria-label="Подтверждённое время"
              className={`${fieldBase} min-h-11 w-32`}
            />
            <button type="submit" disabled={tmPending} className={lineBtn}>
              {tmPending ? "Сохраняем…" : "Сохранить"}
            </button>
            <Result state={tm} pending={tmPending} className="" />
          </form>

          {(o.mode === "delivery" || o.mode === "room") && (
            <form onSubmit={submitKeeping(setFe)} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={o.id} />
              <span className={miniLabel}>{o.mode === "delivery" ? "Доставка" : "Подача"}</span>
              <input
                name="fee"
                inputMode="numeric"
                defaultValue={o.feePending || o.fee === null ? "" : String(o.fee)}
                placeholder="сум"
                maxLength={12}
                autoComplete="off"
                aria-label="Сбор, сум"
                className={`${fieldBase} min-h-11 w-32 text-right`}
              />
              <button type="submit" disabled={fePending} className={lineBtn}>
                {fePending ? "Сохраняем…" : o.feePending ? "Утвердить сбор" : "Изменить сбор"}
              </button>
              <Result state={fe} pending={fePending} className="" />
            </form>
          )}

          {canCancel && (
            <form
              onSubmit={submitKeeping(setSt, () => confirm(`Отменить заказ #${o.number}? Вернуть его будет нельзя.`))}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="status" value="cancelled" />
              <select
                name="reason"
                required
                defaultValue=""
                aria-label="Причина отмены"
                className={`${fieldBase} min-h-11 max-w-full`}
              >
                <option value="" disabled>
                  Причина отмены…
                </option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={CANCEL_REASON_LABEL[r]}>
                    {CANCEL_REASON_LABEL[r]}
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
              <button type="submit" disabled={stPending} className={dangerBtn}>
                Отменить заказ
              </button>
            </form>
          )}
          <Result state={st} pending={stPending} />
        </div>
      )}

      {o.status !== "cancelled" && (
        <form action={setPay} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="paid" value={paid ? "" : "1"} />
          <button type="submit" disabled={payPending} className={lineBtn}>
            {payPending ? "Сохраняем…" : paid ? "Снять оплату" : "Отметить оплаченным"}
          </button>
          <Result state={pay} pending={payPending} className="" />
        </form>
      )}

      <History log={log} label={statusLabel} />
    </li>
  );
}

export function OrdersList({
  orders,
  histories,
  highlight,
  filterLabel,
}: {
  orders: Order[];
  histories: Record<string, StatusLogEntry[]>;
  highlight: number | null;
  filterLabel: string;
}) {
  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
        В фильтре «{filterLabel}» заказов нет. Новый заказ с сайта появится здесь и в Telegram
        одновременно.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <OrderCard key={o.id} o={o} log={histories[String(o.id)] ?? []} highlight={highlight === o.id} />
      ))}
    </ul>
  );
}
