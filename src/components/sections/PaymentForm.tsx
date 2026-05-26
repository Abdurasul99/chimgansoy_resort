"use client";

import { useState } from "react";

type Dict = {
  title: string;
  lead: string;
  guestName: string;
  email: string;
  checkin: string;
  checkout: string;
  amount: string;
  amountPlaceholder: string;
  submit: string;
  submitting: string;
  agreement: string;
  errorAmount: string;
  errorName: string;
  errorServer: string;
  notConfigured: string;
};

type Props = {
  dict: Dict;
  defaultCheckin?: string;
  defaultCheckout?: string;
};

export function PaymentForm({ dict, defaultCheckin = "", defaultCheckout = "" }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const guestName = (data.get("guestName") as string).trim();
    const email = (data.get("email") as string).trim();
    const checkin = data.get("checkin") as string;
    const checkout = data.get("checkout") as string;
    const amountRaw = (data.get("amount") as string).trim();
    const amount = Number(amountRaw.replace(/\s/g, ""));

    if (!guestName) { setError(dict.errorName); return; }
    if (!amount || amount <= 0) { setError(dict.errorAmount); return; }

    setPending(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          guestName,
          clientEmail: email,
          checkin,
          checkout,
          orderDescription: `CHIMGAN DARBAZA — ${checkin} / ${checkout}`,
        }),
      });

      const json = await res.json() as { paymentUrl?: string; error?: string };

      if (!res.ok || !json.paymentUrl) {
        if (res.status === 501) {
          setError(dict.notConfigured);
        } else {
          setError(json.error ?? dict.errorServer);
        }
        return;
      }

      window.location.href = json.paymentUrl;
    } catch {
      setError(dict.errorServer);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-[color:var(--line)] bg-white p-6 sm:p-8">
      <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">{dict.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{dict.lead}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--muted)]">{dict.guestName}</label>
          <input
            className="booking-field w-full"
            type="text"
            name="guestName"
            placeholder={dict.guestName}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--muted)]">{dict.email}</label>
          <input
            className="booking-field w-full"
            type="email"
            name="email"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--muted)]">{dict.checkin}</label>
          <input
            className="booking-field w-full"
            type="date"
            name="checkin"
            defaultValue={defaultCheckin}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--muted)]">{dict.checkout}</label>
          <input
            className="booking-field w-full"
            type="date"
            name="checkout"
            defaultValue={defaultCheckout}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--muted)]">{dict.amount}</label>
          <input
            className="booking-field w-full"
            type="number"
            name="amount"
            min="1"
            placeholder={dict.amountPlaceholder}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
        )}

        <div className="sm:col-span-2">
          <p className="mb-4 text-xs text-[var(--muted)]">{dict.agreement}</p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-[var(--green)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
          >
            {pending ? dict.submitting : dict.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
