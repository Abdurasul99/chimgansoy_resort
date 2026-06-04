"use client";

import { useActionState, useRef } from "react";
import { submitContact } from "@/app/actions/contact";
import { Icon } from "@/components/ui/Icon";

type Dict = {
  name: string;
  phone: string;
  message: string;
  send: string;
  sending: string;
  success: string;
  errorRequired: string;
};

type Props = { dict: Dict };

type State = { status: "idle" | "ok" | "error"; message?: string };

const initialState: State = { status: "idle" };

async function formAction(_prev: State, formData: FormData): Promise<State> {
  const result = await submitContact(formData);
  if (result.ok) return { status: "ok" };
  return { status: "error", message: result.error };
}

export function ContactForm({ dict }: Props) {
  const [state, action, pending] = useActionState(formAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-[#f0c26a]/30 bg-[#f0c26a]/8 p-6 text-center backdrop-blur-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0c26a]/15">
          <svg className="h-6 w-6 text-[#f0c26a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-xl font-semibold text-white">{dict.success}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {/* Name + Phone row */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <label className="group block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            <Icon name="user" className="h-3 w-3" />
            {dict.name}
          </span>
          <div className="relative">
            <input
              type="text"
              name="name"
              aria-label={dict.name}
              required
              autoComplete="name"
              className="w-full rounded-xl border border-white/14 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#f0c26a] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#f0c26a]/20"
            />
          </div>
        </label>

        {/* Phone */}
        <label className="group block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            <Icon name="phone" className="h-3 w-3" />
            {dict.phone}
          </span>
          <div className="relative">
            <input
              type="tel"
              name="phone"
              aria-label={dict.phone}
              required
              autoComplete="tel"
              placeholder="+998 90 000 00 00"
              className="w-full rounded-xl border border-white/14 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#f0c26a] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#f0c26a]/20"
            />
          </div>
        </label>
      </div>

      {/* Message */}
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
          <Icon name="mail" className="h-3 w-3" />
          {dict.message}
        </span>
        <textarea
          name="message"
          aria-label={dict.message}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/14 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#f0c26a] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#f0c26a]/20"
        />
      </label>

      {/* Error */}
      {state.status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/8 px-3 py-2 text-sm text-red-200">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
          </svg>
          <span>{state.message ?? dict.errorRequired}</span>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-press group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--sun)] px-7 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(220,140,0,0.32)] transition-all duration-300 hover:bg-[var(--sun-dark)] hover:shadow-[0_16px_40px_rgba(220,140,0,0.42)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          <span>{pending ? dict.sending : dict.send}</span>
          {pending ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          ) : (
            <Icon name="send" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>
    </form>
  );
}
