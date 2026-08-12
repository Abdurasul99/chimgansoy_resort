"use client";

import { useActionState, useState } from "react";
import { createBooking, runImport, type BroniState } from "./actions";
import type { UnitRow } from "@/lib/pms";

const input =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

/**
 * Разовый перенос старых заявок из Blob.
 *
 * Кнопка живёт здесь, а не отдельным экраном: нажимают её один раз в жизни
 * проекта, и ради этого заводить пункт меню значило бы навсегда занять место
 * тем, что больше никогда не понадобится.
 */
function ImportButton() {
  const [state, act, pending] = useActionState<BroniState, FormData>(runImport, {});
  return (
    <form action={act} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-[color:var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--sun)] hover:text-[var(--ink)] disabled:opacity-50"
      >
        {pending ? "Переносим…" : "Перенести старые заявки"}
      </button>
      {state.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</span>}
      {state.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</span>}
    </form>
  );
}

/**
 * Бронь с телефона — свёрнута по умолчанию.
 *
 * Экран открывают, чтобы работать с тем, что уже пришло; форма на восемь полей
 * поверх списка отодвигала бы брони вниз при каждом заходе. Разворачивается
 * одной кнопкой, когда оператор снял трубку.
 */
export function NewBooking({ units }: { units: UnitRow[] }) {
  const [open, setOpen] = useState(false);
  const [state, act, pending] = useActionState<BroniState, FormData>(createBooking, {});
  // Список номеров зависит от типа: шале в глэмпинг не поселить.
  const [room, setRoom] = useState("glamping");

  if (!open) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-[color:var(--line-strong)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)]"
        >
          + Бронь с телефона
        </button>
        <ImportButton />
      </div>
    );
  }

  return (
    <form action={act} className="mb-6 rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Новая бронь</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--muted)] underline">
          свернуть
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={label}>Размещение</span>
          <select name="room_slug" value={room} onChange={(e) => setRoom(e.target.value)} className={input}>
            <option value="glamping">Глэмпинг A-frame</option>
            <option value="cottage">Шале</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Заезд</span>
          <input name="checkin" type="date" required className={input} />
        </label>
        <label className="block">
          <span className={label}>Выезд</span>
          <input name="checkout" type="date" className={input} />
        </label>

        <label className="block">
          <span className={label}>Гость</span>
          <input name="guest_name" required placeholder="Имя" className={input} />
        </label>
        <label className="block">
          <span className={label}>Телефон</span>
          <input name="phone" required placeholder="+998 __ ___ __ __" className={input} />
        </label>
        <label className="block">
          <span className={label}>
            Почта <span className="font-normal normal-case">— для подтверждения</span>
          </span>
          <input name="email" type="email" className={input} />
        </label>

        <label className="block">
          <span className={label}>Взрослых</span>
          <input name="adults" type="number" min={0} defaultValue={2} className={input} />
        </label>
        <label className="block">
          <span className={label}>Детей</span>
          <input name="kids" type="number" min={0} defaultValue={0} className={input} />
        </label>
        <label className="block">
          <span className={label}>Сумма</span>
          <input name="total" type="number" min={0} defaultValue={0} className={input} />
        </label>

        <label className="block">
          <span className={label}>
            Номер <span className="font-normal normal-case">— можно позже</span>
          </span>
          <select name="unit" defaultValue="" className={input}>
            <option value="">— не закреплять —</option>
            {units
              .filter((u) => u.room_slug === room && u.active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id}
                </option>
              ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Комментарий</span>
          <input name="comment" placeholder="Что просил гость" className={input} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-2.5 text-sm font-extrabold text-[var(--on-accent)] transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Создаём…" : "Создать бронь"}
        </button>
        {state.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</span>}
        {state.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</span>}
      </div>
    </form>
  );
}
