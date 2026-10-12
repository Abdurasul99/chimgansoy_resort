import type { ReactNode } from "react";
import type { ActionState } from "./actions";

/**
 * Общее для экранов ресторана: классы полей и кнопок, строка результата,
 * пустые состояния.
 *
 * Без хуков и без "use client": модуль берут и серверные страницы, и
 * клиентские формы. Хук отправки формы — отдельно, в form-hooks.ts.
 */

/** 16 px на телефоне: iOS приближает страницу на полях мельче, а персонал работает с телефона. */
export const fieldBase =
  "rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50 sm:text-sm";
export const field = `w-full ${fieldBase}`;
export const labelText = "mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

/** Большая кнопка сохранения — как в «Услугах» и «Ценах». */
export const saveBtn =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";
export const lineBtn =
  "min-h-11 rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-50";
export const linkBtn =
  "text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50";

export function Result({
  state,
  pending = false,
  className = "mt-2",
}: {
  state: ActionState;
  pending?: boolean;
  className?: string;
}) {
  if (pending) return null;
  if (state.error) {
    return (
      <p role="alert" className={`${className} text-sm font-semibold text-[var(--rose,#b4413c)]`}>
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return <p className={`${className} text-sm font-semibold text-[var(--green,#3f7d52)]`}>{state.ok}</p>;
  }
  return null;
}

export function Notice({
  tone = "warn",
  title,
  children,
}: {
  tone?: "warn" | "ok" | "info";
  title: string;
  children?: ReactNode;
}) {
  const look =
    tone === "warn"
      ? "border-[var(--sun)]/60 bg-[var(--sun)]/10"
      : tone === "ok"
        ? "border-[var(--green,#3f7d52)]/30 bg-[var(--green,#3f7d52)]/10"
        : "border-[color:var(--line)] bg-[var(--surface-warm)]";
  return (
    <div className={`rounded-2xl border p-4 text-sm leading-6 ${look}`}>
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      {children && <div className="mt-1 text-[var(--muted)]">{children}</div>}
    </div>
  );
}

/** Пустой список и «нет базы» — разные вещи, и оператор должен видеть, какая из них. */
export function DbOffline() {
  return (
    <Notice title="База ресторана не подключена">
      Не задана переменная <code>DATABASE_URL</code>. Без неё меню и настройки ресторана негде хранить —
      на сайте раздел показывает пустое меню.
    </Notice>
  );
}

export function StoreError({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
      Не удалось прочитать базу ресторана: {message}
    </p>
  );
}

export function NoAccess() {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6">
      <p className="font-serif text-2xl font-semibold">Нет доступа</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Настройки ресторана меняет менеджер ресторана или администратор сайта.
      </p>
    </div>
  );
}

/** 1 блюдо / 2 блюда / 5 блюд — то же правило, что в «Журнале». */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 14) return many;
  const last = abs % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
