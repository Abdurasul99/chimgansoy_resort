import Link from "next/link";
import type { ReactNode } from "react";
import type { StatusLogEntry } from "@/lib/restaurant/model";
import { stamp } from "@/lib/restaurant/labels";
import type { ActionState } from "./actions";

/**
 * Общее для экранов ресторана: классы полей и кнопок, строка результата,
 * фильтры, пустые состояния.
 *
 * Без хуков и без "use client": модуль берут и серверные страницы, и
 * клиентские списки. Хук отправки формы — отдельно, в form-hooks.ts.
 */

/** 16 px на телефоне: iOS приближает страницу на полях мельче, а персонал работает с телефона. */
export const fieldBase =
  "rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50 sm:text-sm";
export const field = `w-full ${fieldBase}`;
export const labelText = "mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";
export const miniLabel = "text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

/** Большая кнопка сохранения — как в «Услугах» и «Ценах». */
export const saveBtn =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";
/** Кнопки статусов — как в «Бронях», но с высотой под палец. */
export const goldBtn =
  "min-h-11 rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-4 py-2 text-sm font-bold text-[var(--on-accent)] transition hover:brightness-[1.05] disabled:opacity-50";
export const lineBtn =
  "min-h-11 rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-50";
export const dangerBtn =
  "min-h-11 rounded-xl border border-[var(--rose,#b4413c)]/45 px-4 py-2 text-sm font-bold text-[var(--rose,#b4413c)] transition hover:bg-[var(--rose,#b4413c)]/10 disabled:opacity-50";
export const linkBtn =
  "text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50";
export const chip = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold";

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

export function FilterLink({ href, on, children }: { href: string; on: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={on ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        on
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "border border-[color:var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </Link>
  );
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
      Не задана переменная <code>DATABASE_URL</code>. Без неё сайт не принимает заказы ресторана
      вовсе: заказ сначала сохраняется в базу и только потом уходит в Telegram.
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
        Меню и настройки ресторана меняет менеджер ресторана или администратор сайта.
      </p>
    </div>
  );
}

const VIA: Record<StatusLogEntry["via"], string> = { site: "сайт", admin: "панель", telegram: "Telegram" };

/**
 * История статусов. Строка «from = to» — не смена статуса, а отметка
 * (время, оплата): у неё смысл в причине, а не в стрелке.
 */
export function History({ log, label }: { log: StatusLogEntry[]; label: (status: string) => string }) {
  if (log.length === 0) return null;
  return (
    <details className="mt-4">
      <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        История ({log.length})
      </summary>
      <ol className="mt-2 space-y-1.5 border-l-2 border-[color:var(--line)] pl-3">
        {log.map((h, i) => {
          const what =
            h.from === null
              ? `создана · ${label(h.to)}`
              : h.from === h.to
                ? h.reason || label(h.to)
                : `${label(h.from)} → ${label(h.to)}${h.reason ? ` — ${h.reason}` : ""}`;
          return (
            <li key={`${h.at}-${i}`} className="text-xs leading-5 text-[var(--ink)]">
              <span className="tabular-nums text-[var(--muted)]">{stamp(h.at)}</span> · {what}
              <span className="text-[var(--muted)]">
                {" "}
                · {h.byWhom || "—"} · {VIA[h.via] ?? h.via}
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/** 1 заказ / 2 заказа / 5 заказов — то же правило, что в «Журнале». */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 14) return many;
  const last = abs % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
