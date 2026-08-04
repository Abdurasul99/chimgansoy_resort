"use server";

import { redirect } from "next/navigation";
import { endSession, passwordMatches, startSession, authConfigured } from "@/lib/admin-auth";

/**
 * Sign-in and sign-out for /admin.
 *
 * `useActionState` shape: the action takes the previous state and the form
 * data, and returns the next state. The only state worth carrying is the error
 * message, because a successful sign-in redirects away from the form.
 */
export type SignInState = { error?: string };

/**
 * A deliberate, constant delay on every attempt.
 *
 * There is one password and it is the only thing between the internet and the
 * price list. A serverless function will happily answer a few hundred guesses a
 * second, and there is no per-IP counter to keep between invocations — each
 * request may land on a different instance, so an in-memory rate limiter is
 * theatre. A fixed second per attempt costs the operator one second a day and
 * costs a script four months per million guesses, which for a 14-character
 * alphanumeric password is not the binding constraint anyway. It also flattens
 * the timing difference between "no such password set" and "wrong password".
 */
const ATTEMPT_DELAY_MS = 1000;

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const password = String(formData.get("password") ?? "");

  if (!authConfigured()) {
    return { error: "Панель не настроена: не заданы ADMIN_PASSWORD и AUTH_SECRET." };
  }

  await new Promise((r) => setTimeout(r, ATTEMPT_DELAY_MS));

  if (!passwordMatches(password)) {
    return { error: "Неверный пароль." };
  }

  await startSession();
  // Outside the try/catch idiom on purpose: redirect() signals by throwing, so
  // wrapping it would swallow the navigation and report it as a failure.
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/admin");
}
