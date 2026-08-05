import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";
import { authConfigured, isSignedIn } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";
import { AdminNav } from "./AdminNav";
import { signOut } from "./actions";

/**
 * The operator's panel lives outside the public site in every sense.
 *
 * It renders its own <html> and <body> because this app has no root layout:
 * every public page hangs off src/app/[locale]/layout.tsx, which IS the root
 * for that subtree. A page under /admin has nothing above it, so the document
 * shell has to start here.
 *
 * Nothing from the public chrome is mounted — no Header, Footer, FaqPanel,
 * LogoIntro splash, SeasonDetector, SnowParticles, Lenis smooth scroll or
 * analytics. Every one of those is a liability in a tool: the splash would
 * cover the login form on every visit, Lenis would fight a long form's native
 * scrolling, and there is no reason to send a page view to Yandex Metrica when
 * the operator edits a price.
 *
 * THE SESSION GATE LIVES HERE, not in the pages. It used to be in page.tsx,
 * which was fine while /admin was the only screen — the moment a second one
 * exists, that page is readable by anyone unless its author remembers to
 * repeat the check. One gate the framework enforces beats six gates people
 * remember. `requireAdmin()` inside every server action stays as the
 * independent second layer, because a layout does not protect an action.
 *
 * /admin is also excluded from the locale proxy (src/proxy.ts) and disallowed
 * in robots.ts.
 */

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Панель управления · CHIMGAN DARBAZA",
  // Belt and braces with robots.ts: a Disallow keeps a crawler from fetching
  // the page, this keeps it out of the index if it reaches it another way.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Every admin page reads the session cookie and live data, so none of them can
 * be prerendered. Declaring it here means a new page cannot forget.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await isSignedIn();

  return (
    <html lang="ru" className={sans.variable}>
      <body className="admin-root min-h-screen bg-[var(--surface)] font-sans text-[var(--ink)] antialiased">
        {!signedIn ? (
          <main className="flex min-h-screen items-center justify-center px-5 py-16">
            <div className="w-full max-w-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
                CHIMGAN DARBAZA
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)]">
                Панель управления
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Заявки, аналитика, цены, услуги и новости.
              </p>

              <div className="mt-8">
                {authConfigured() ? (
                  <LoginForm />
                ) : (
                  <div className="rounded-xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
                    <p className="text-sm font-semibold text-[var(--ink)]">Панель не настроена</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Не заданы переменные <code>ADMIN_PASSWORD</code> и <code>AUTH_SECRET</code>.
                      Добавьте их в проект на Vercel и перезапустите деплой.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-[color:var(--line)] bg-[var(--paper)]/95 backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                  CHIMGAN DARBAZA
                </span>
                <AdminNav />
                {/* A form posting a server action, not a fetch: it works with
                    JavaScript disabled and cannot hang in a pending state. */}
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
        )}
      </body>
    </html>
  );
}
