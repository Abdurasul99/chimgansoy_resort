"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact } from "@/app/actions/contact";

type BronDict = {
  formTitle: string;
  name: string;
  phone: string;
  message: string;
  send: string;
  sending: string;
  success: string;
  errorRequired: string;
};

type FieldLabels = {
  checkIn: string;
  checkOut: string;
  guests: string;
};

type Props = {
  dict: BronDict;
  labels: FieldLabels;
  defaultCheckin?: string;
  defaultCheckout?: string;
  defaultGuests?: string;
  defaultRoom?: string;
};

type State = { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

const initialState: State = { status: "idle" };

async function formAction(_prev: State, formData: FormData): Promise<State> {
  const result = await submitContact(formData);
  if (result.ok) return { status: "ok" };
  return { status: "error", message: result.error };
}

function SubmitButton({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition duration-300 hover:bg-[var(--accent-strong)] disabled:opacity-60"
    >
      {pending ? sending : label}
    </button>
  );
}

export function BookingRequestForm({
  dict,
  labels,
  defaultCheckin = "",
  defaultCheckout = "",
  defaultGuests = "",
  defaultRoom = "",
}: Props) {
  const [state, action] = useActionState(formAction, initialState);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.success}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[0_8px_40px_rgba(21,29,24,0.07)] sm:p-8">
      <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.formTitle}</h3>

      <form action={action} className="mt-6 space-y-4">
        {defaultRoom && <input type="hidden" name="room" value={defaultRoom} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              {labels.checkIn}
            </label>
            <input
              type="date"
              name="checkin"
              defaultValue={defaultCheckin}
              className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              {labels.checkOut}
            </label>
            <input
              type="date"
              name="checkout"
              defaultValue={defaultCheckout}
              className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {labels.guests}
          </label>
          <select
            name="guests"
            defaultValue={defaultGuests || "2"}
            className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.name}
          </label>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.phone}
          </label>
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            placeholder="+998 90 000 00 00"
            className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.message}
          </label>
          <textarea
            name="message"
            rows={3}
            className="w-full resize-none rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        {state.status === "error" && (
          <p className="text-sm font-medium text-red-600">{state.message || dict.errorRequired}</p>
        )}

        <SubmitButton label={dict.send} sending={dict.sending} />
      </form>
    </div>
  );
}
