"use client";

import { useActionState, useEffect } from "react";
import { submitPartnerRequest } from "@/app/actions/partners";
import { partnersPage } from "@/content/partners";
import { PageContextFields } from "@/components/ui/PageContextFields";
import { trackEvent } from "@/lib/analytics";
import { localizePath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

type State = { status: "idle" | "ok" | "error"; message?: string };

async function formAction(_prev: State, formData: FormData): Promise<State> {
  const result = await submitPartnerRequest(formData);
  return result.ok ? { status: "ok" } : { status: "error", message: result.error };
}

const input =
  "w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const label = "mb-1.5 block text-sm font-semibold text-[var(--ink)]";

/**
 * Заявка «Обсудить партнёрство» — в Telegram-группу, на почту и в журнал.
 *
 * calcSummary — сводка расчёта из рабочей панели (/partners/detail): менеджер
 * видит отрасль, пакет и ROMI, которые партнёр уже посчитал. hideProgram
 * убирает выбор программы там, где сценарий задаёт калькулятор.
 */
export function PartnerRequestForm({ locale, calcSummary, hideProgram = false }: { locale: Locale; calcSummary?: string; hideProgram?: boolean }) {
  const [state, action, pending] = useActionState(formAction, { status: "idle" } as State);
  const t = partnersPage.form;
  const tx = (s: Record<Locale, string>) => s[locale];

  useEffect(() => {
    if (state.status === "ok") trackEvent("partner_request_submitted", { form: "partners", with_calc: Boolean(calcSummary) });
  }, [state.status, calcSummary]);

  if (state.status === "ok") {
    return (
      <p role="status" className="rounded-2xl bg-[var(--surface-warm)] p-6 text-center text-lg font-semibold text-[var(--ink)]">
        {tx(t.success)}
      </p>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      {calcSummary && <input type="hidden" name="calc" value={calcSummary} />}
      <PageContextFields />
      {/* Ловушка для ботов: человек это поле не видит. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <label className="block sm:col-span-2">
        <span className={label}>{tx(t.org)} *</span>
        <input name="org" required maxLength={120} autoComplete="organization" className={input} />
      </label>
      <label className="block">
        <span className={label}>{tx(t.name)} *</span>
        <input name="name" required maxLength={80} autoComplete="name" className={input} />
      </label>
      <label className="block">
        <span className={label}>{tx(t.phone)}</span>
        <input name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder="+998" className={input} />
      </label>
      <label className="block">
        <span className={label}>{tx(t.email)}</span>
        <input name="email" type="email" maxLength={120} autoComplete="email" className={input} />
      </label>
      {!hideProgram && (
      <label className="block">
        <span className={label}>{tx(t.program)}</span>
        <select name="program" defaultValue="" className={input}>
          <option value="">—</option>
          {partnersPage.programs.items.map((p) => (
            <option key={p.id} value={p.id}>
              {tx(p.title)}
            </option>
          ))}
          <option value="other">{tx(t.other)}</option>
        </select>
      </label>
      )}
      <label className="block sm:col-span-2">
        <span className={label}>{tx(t.message)}</span>
        <textarea name="message" rows={4} maxLength={2000} className={input} />
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--ink)]/80 sm:col-span-2">
        <input type="checkbox" name="privacyConsent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--sun)]" />
        <span>
          {tx(t.privacy)} —{" "}
          <a href={localizePath(locale, "/legal/privacy-policy")} target="_blank" rel="noopener" className="underline">
            {locale === "uz" ? "maxfiylik siyosati" : locale === "en" ? "privacy policy" : "политика конфиденциальности"}
          </a>
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--sun)] px-6 py-3.5 text-base font-bold text-[var(--ink)] transition hover:bg-[var(--sun-dark)] disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {pending ? tx(t.sending) : tx(t.send)}
      </button>
    </form>
  );
}
