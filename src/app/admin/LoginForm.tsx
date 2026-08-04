"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

/**
 * The login form.
 *
 * Client only because it needs the pending state — sign-in deliberately takes a
 * full second (see actions.ts), and a button that does nothing visible for a
 * second reads as broken and gets pressed again.
 */
export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="w-full max-w-sm">
      <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Пароль
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30"
      />

      {state.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-[#c0392b]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-5 py-3.5 text-base font-extrabold text-[var(--on-accent)] shadow-[0_14px_32px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}
