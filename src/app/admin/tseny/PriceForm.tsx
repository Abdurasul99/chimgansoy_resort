"use client";

import { useActionState } from "react";
import { savePrices, type PriceFormState } from "./actions";
import { money } from "@/lib/admin-format";

type Field = { key: string; group: string; label: string; hint?: string; value: number; overridden: boolean };

/**
 * The price editor.
 *
 * Client only for the pending and result state — a save takes a network round
 * trip to Blob, and a button that does nothing visible gets pressed twice.
 */
export function PriceForm({ fields, storeReady }: { fields: Field[]; storeReady: boolean }) {
  const [state, action, pending] = useActionState<PriceFormState, FormData>(savePrices, {});

  const groups = [...new Set(fields.map((f) => f.group))];

  return (
    <form action={action}>
      {!storeReady && (
        <p className="mb-6 rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5 text-sm leading-6 text-[var(--muted)]">
          Хранилище не подключено — сохранить не получится. Показаны цены из кода сайта.
        </p>
      )}

      <div className="grid gap-6">
        {groups.map((group) => (
          <section key={group} className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
            <h2 className="border-b border-[color:var(--line)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              {group}
            </h2>
            <div className="divide-y divide-[color:var(--line)]">
              {fields
                .filter((f) => f.group === group)
                .map((f) => (
                  <label key={f.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--ink)]">{f.label}</span>
                      {f.hint && <span className="block text-xs text-[var(--muted)]">{f.hint}</span>}
                    </span>

                    {f.overridden && (
                      <span
                        className="rounded-full bg-[var(--sun)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--sun-dark)]"
                        title="Значение изменено вами и отличается от того, что в коде сайта"
                      >
                        изменено
                      </span>
                    )}

                    <span className="flex items-center gap-2">
                      <input
                        name={f.key}
                        defaultValue={money(f.value)}
                        inputMode="numeric"
                        autoComplete="off"
                        disabled={!storeReady}
                        className="w-36 rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-right text-sm font-bold tabular-nums text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50"
                      />
                      <span className="text-sm text-[var(--muted)]">сум</span>
                    </span>
                  </label>
                ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-[color:var(--line)] bg-[var(--surface)]/95 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending || !storeReady}
          className="rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сохранить цены"}
        </button>

        {state.error && (
          <span role="alert" className="text-sm font-semibold text-[#c0392b]">
            {state.error}
          </span>
        )}
        {state.ok && !pending && (
          <span className="text-sm font-semibold text-[var(--accent-strong)]">
            {state.saved === 0
              ? "Ничего не изменилось."
              : `Сохранено. Изменений: ${state.saved}. На сайте — сразу.`}
          </span>
        )}
      </div>

      <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
        Пустое поле или цена, совпадающая с исходной, снимает вашу правку — тогда цена снова следует
        за сайтом. Цены проживания сюда не входят: они живут в системе бронирования Exely, и
        держать их в двух местах — верный способ получить расхождение.
      </p>
    </form>
  );
}
