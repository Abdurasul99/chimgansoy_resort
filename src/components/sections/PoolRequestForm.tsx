"use client";

import { useActionState, useEffect } from "react";
import { submitPoolRequest } from "@/app/actions/pool";
import { poolPricing } from "@/content/pricing";
import { contacts } from "@/content/contacts";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { trackEvent } from "@/lib/analytics";
import { text } from "@/lib/localize";
import type { Locale } from "@/i18n/config";

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    date: string;
    guests: string;
    name: string;
    namePh: string;
    phone: string;
    message: string;
    messagePh: string;
    send: string;
    sending: string;
    successTitle: string;
    successText: string;
    note: string;
    priceTitle: string;
  }
> = {
  ru: {
    eyebrow: "Бассейн · без ночёвки",
    title: "Оставить заявку",
    lead: "Выберите дату и число гостей — администратор перезвонит, подтвердит свободное время и забронирует место.",
    date: "Дата визита",
    guests: "Гостей",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    message: "Комментарий",
    messagePh: "Пожелания, время приезда, дети…",
    send: "Отправить заявку",
    sending: "Отправляем…",
    successTitle: "Заявка принята",
    successText: "Администратор свяжется с вами в ближайшее время и подтвердит бронь.",
    note: "Заявка — это ещё не оплата. Бронь подтверждает администратор.",
    priceTitle: "Стоимость",
  },
  uz: {
    eyebrow: "Basseyn · tunamasdan",
    title: "Ariza qoldiring",
    lead: "Sana va mehmonlar sonini tanlang — administrator qo'ng'iroq qilib, bo'sh vaqtni tasdiqlaydi va joy band qiladi.",
    date: "Tashrif sanasi",
    guests: "Mehmonlar",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    message: "Izoh",
    messagePh: "Tilaklar, kelish vaqti, bolalar…",
    send: "Arizani yuborish",
    sending: "Yuborilmoqda…",
    successTitle: "Ariza qabul qilindi",
    successText: "Administrator tez orada bog'lanib, bronni tasdiqlaydi.",
    note: "Ariza — bu hali to'lov emas. Bronni administrator tasdiqlaydi.",
    priceTitle: "Narxi",
  },
  en: {
    eyebrow: "Pool · no overnight stay",
    title: "Send a request",
    lead: "Pick a date and the number of guests — our administrator will call back, confirm availability and hold your place.",
    date: "Visit date",
    guests: "Guests",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    message: "Comment",
    messagePh: "Preferences, arrival time, children…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request received",
    successText: "Our administrator will contact you shortly to confirm the booking.",
    note: "A request is not a payment. The administrator confirms the booking.",
    priceTitle: "Price",
  },
};

type State = { status: "idle" | "ok" | "error"; message?: string };
const initialState: State = { status: "idle" };

async function formAction(_prev: State, formData: FormData): Promise<State> {
  const res = await submitPoolRequest(formData);
  return res.ok ? { status: "ok" } : { status: "error", message: res.error };
}

function money(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]";
const labelCls =
  "mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]";

export function PoolRequestForm({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.ru;
  const [state, action, pending] = useActionState(formAction, initialState);

  useEffect(() => {
    if (state.status === "ok") trackEvent("pool_request_submitted", { form: "pool" });
  }, [state.status]);

  if (state.status === "ok") {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green)]/12">
          <svg className="h-7 w-7 text-[var(--green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-2xl font-semibold text-[var(--ink)]">{t.successTitle}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{t.successText}</p>
        <a
          href={`tel:${contacts.phone.replaceAll(" ", "")}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest-dark)] hover:text-[var(--accent-strong)]"
        >
          <Icon name="phone" className="h-4 w-4" />
          {contacts.phone}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-6 sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">{t.eyebrow}</p>
      <h3 className="mt-3 font-serif text-2xl font-semibold text-[var(--ink)] sm:text-3xl">{t.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{t.lead}</p>

      {/* The tariff, stated before the guest fills anything in */}
      <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.priceTitle}</p>
        <dl className="mt-3 space-y-2">
          {[
            [poolPricing.weekdayLabel, poolPricing.weekday] as const,
            [poolPricing.weekendLabel, poolPricing.weekend] as const,
          ].map(([label, value]) => (
            <div key={value} className="flex items-baseline gap-3">
              <dt className="text-sm text-[var(--ink)]">{text(label, locale)}</dt>
              <span aria-hidden className="flex-1 border-b border-dotted border-[color:var(--line-strong)]" />
              <dd className="whitespace-nowrap font-serif text-lg font-semibold text-[var(--ink)]">
                {money(value)}{" "}
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  сум {poolPricing.perPerson ? text(poolPricing.perPersonLabel, locale) : ""}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {/* Honeypot — invisible to humans, filled only by bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* A plain number field, not the GuestSelect dropdown used for rooms:
            that one stops at 8, and the pool has no party-size limit. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker name="date" label={t.date} locale={locale} minToday />
          <label className="block">
            <span className={labelCls}>
              <Icon name="user" className="h-3 w-3" />
              {t.guests}
            </span>
            <input
              name="guests"
              type="number"
              min={1}
              max={200}
              step={1}
              defaultValue={2}
              inputMode="numeric"
              className={`${field} min-h-14`}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>
              <Icon name="user" className="h-3 w-3" />
              {t.name}
            </span>
            <input name="name" required placeholder={t.namePh} autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>
              <Icon name="phone" className="h-3 w-3" />
              {t.phone}
            </span>
            <input
              name="phone"
              required
              type="tel"
              inputMode="tel"
              placeholder="+998 __ ___ __ __"
              autoComplete="tel"
              className={field}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelCls}>{t.message}</span>
          <textarea name="message" rows={3} placeholder={t.messagePh} className={`${field} resize-none`} />
        </label>

        {state.status === "error" && state.message && (
          <p role="alert" className="rounded-xl bg-[#c0392b]/10 px-4 py-3 text-sm font-semibold text-[#c0392b]">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-press w-full rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-5 py-3.5 text-sm font-bold text-[var(--on-accent)] shadow-[0_8px_22px_-6px_rgba(220,140,0,0.55)] transition-all hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t.sending : t.send}
        </button>

        <p className="text-center text-xs leading-5 text-[var(--muted)]">{t.note}</p>
      </form>
    </div>
  );
}
