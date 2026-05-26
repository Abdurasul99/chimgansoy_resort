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
      <div className="flex min-h-36 items-center rounded-[8px] border border-white/14 bg-white/8 px-6 py-5 text-sm text-white/80">
        ✓ {dict.success}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <input
        className="footer-input"
        type="text"
        name="name"
        placeholder={dict.name}
        aria-label={dict.name}
        required
      />
      <input
        className="footer-input"
        type="tel"
        name="phone"
        placeholder={dict.phone}
        aria-label={dict.phone}
        required
      />
      <textarea
        className="footer-input min-h-28 sm:col-span-2"
        name="message"
        placeholder={dict.message}
        aria-label={dict.message}
      />
      {state.status === "error" && (
        <p className="text-sm text-red-300 sm:col-span-2">{state.message ?? dict.errorRequired}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-press btn-glow-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white shadow-[var(--shadow-card)] transition disabled:opacity-60 sm:w-fit sm:col-span-2"
      >
        <span>{pending ? dict.sending : dict.send}</span>
        {!pending && <Icon name="send" className="h-4 w-4" />}
      </button>
    </form>
  );
}
