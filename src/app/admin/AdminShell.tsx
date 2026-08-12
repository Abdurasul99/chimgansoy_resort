import Link from "next/link";
import { signOut } from "./actions";

/**
 * The frame every signed-in admin screen sits in.
 *
 * A server component: nothing here needs state, and the sign-out is a form
 * posting a server action rather than a fetch, so it works with JavaScript
 * disabled and cannot get stuck in a pending state.
 */

const NAV = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/zayavki", label: "Заявки" },
  { href: "/admin/analitika", label: "Аналитика" },
  { href: "/admin/tseny", label: "Цены" },
  { href: "/admin/uslugi", label: "Услуги" },
  { href: "/admin/novosti", label: "Новости" },
];

export function AdminShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[color:var(--line)] bg-[var(--paper)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            CHIMGAN DARBAZA
          </span>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:overflow-visible">
            {NAV.map((item) => {
              const on = item.href === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    on
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              className="rounded-full border border-[color:var(--line)] px-3.5 py-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--ink)]/30 hover:text-[var(--ink)]"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}

/** Page heading with an optional line of context under it. */
export function AdminHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-serif text-3xl font-semibold text-[var(--ink)]">{title}</h1>
      {hint && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/**
 * Shown wherever the archive is unreachable.
 *
 * Named rather than generic: "нет данных" would read as "no bookings", which is
 * a very different thing to tell an operator than "the store is not connected".
 */
export function StoreOffline() {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6">
      <p className="text-sm font-semibold text-[var(--ink)]">Архив заявок недоступен</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Не задана переменная <code>BLOB_READ_WRITE_TOKEN</code> либо хранилище не отвечает. Заявки
        при этом продолжают приходить в Telegram и на почту — теряется только этот журнал.
      </p>
    </div>
  );
}
