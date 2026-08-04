import { authConfigured, isSignedIn } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

/**
 * /admin — the door.
 *
 * Signed out, this is the login form and nothing else: no navigation, no hint
 * of what is behind it. Signed in, it hands off to the panel.
 */
export default async function AdminPage() {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
            CHIMGAN DARBAZA
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)]">
            Панель управления
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Услуги, цены, новости и заявки.
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
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <h1 className="font-serif text-3xl font-semibold text-[var(--ink)]">Панель управления</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Разделы подключаются следующим шагом.</p>
    </main>
  );
}
