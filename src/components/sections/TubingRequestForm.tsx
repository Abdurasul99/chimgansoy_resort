"use client";

import { useActionState, useEffect, useState } from "react";
import { submitTubingRequest } from "@/app/actions/tubing";
import { parkingPricing, priceLabels, tubingPricing } from "@/content/pricing";
import { contacts } from "@/content/contacts";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { trackEvent } from "@/lib/analytics";
import { text } from "@/lib/localize";
import { isWeekendISO, money } from "@/lib/tariff";
import type { Locale } from "@/i18n/config";

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    date: string;
    guests: string;
    cars: string;
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
    failed: string;
    priceTitle: string;
    packLabel: (rides: number) => string;
    entry: string;
    total: string;
    seasonNote: string;
  }
> = {
  ru: {
    eyebrow: "Тюбинг-горка",
    title: "Оставить заявку",
    lead: "Выберите дату и количество прокаток — администратор перезвонит, подтвердит время и состояние трассы.",
    date: "Дата визита",
    guests: "Гостей",
    cars: "Автомобилей",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    message: "Комментарий",
    messagePh: "Время приезда, возраст детей…",
    send: "Отправить заявку",
    sending: "Отправляем…",
    successTitle: "Заявка принята",
    successText: "Администратор свяжется с вами в ближайшее время и подтвердит бронь.",
    note: "Заявка — это ещё не оплата. Бронь подтверждает администратор.",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
    priceTitle: "Тариф",
    packLabel: (r) => `${r} прокатки`,
    entry: "Въезд, 1 автомобиль",
    total: "Предварительно к оплате",
    seasonNote:
      "Цена одинаковая в будни и выходные. Тюбинг зависит от снега — состояние трассы на вашу дату подтвердит администратор.",
  },
  uz: {
    eyebrow: "Tubing gorkasi",
    title: "Ariza qoldiring",
    lead: "Sana va uchishlar sonini tanlang — administrator qo'ng'iroq qilib, vaqtni va trassa holatini tasdiqlaydi.",
    date: "Tashrif sanasi",
    guests: "Mehmonlar",
    cars: "Avtomobillar",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    message: "Izoh",
    messagePh: "Kelish vaqti, bolalar yoshi…",
    send: "Arizani yuborish",
    sending: "Yuborilmoqda…",
    successTitle: "Ariza qabul qilindi",
    successText: "Administrator tez orada bog'lanib, bronni tasdiqlaydi.",
    note: "Ariza — bu hali to'lov emas. Bronni administrator tasdiqlaydi.",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
    priceTitle: "Tarif",
    packLabel: (r) => `${r} marta uchish`,
    entry: "Kirish, 1 avtomobil",
    total: "Taxminiy to'lov",
    seasonNote:
      "Narx ish kunlari va dam olish kunlarida bir xil. Tubing qorga bog'liq — trassa holatini administrator tasdiqlaydi.",
  },
  en: {
    eyebrow: "Tubing hill",
    title: "Send a request",
    lead: "Pick a date and how many rides — our administrator will call back to confirm the time and the state of the track.",
    date: "Visit date",
    guests: "Guests",
    cars: "Cars",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    message: "Comment",
    messagePh: "Arrival time, children's ages…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request received",
    successText: "Our administrator will contact you shortly to confirm the booking.",
    note: "A request is not a payment. The administrator confirms the booking.",
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
    priceTitle: "Tariff",
    packLabel: (r) => `${r} rides`,
    entry: "Entry, 1 car",
    total: "Estimated total",
    seasonNote:
      "The same price on weekdays and weekends. Tubing depends on snow — the administrator confirms the track conditions for your date.",
  },
};

type State = { status: "idle" | "ok" | "error"; message?: string };
const initialState: State = { status: "idle" };

/** See the note in TopchanRequestForm — an uncaught rejection loses the form. */
async function formAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const res = await submitTubingRequest(formData);
    return res.ok ? { status: "ok" } : { status: "error", message: res.error };
  } catch (e) {
    console.error("[tubing] submit failed:", e);
    const locale = (formData.get("locale") as string | null) ?? "ru";
    return { status: "error", message: (COPY[locale as Locale] ?? COPY.ru).failed };
  }
}

const field =
  "w-full min-h-14 rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const labelCls =
  "mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]";

export function TubingRequestForm({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.ru;
  const [state, action, pending] = useActionState(formAction, initialState);

  const [guests, setGuests] = useState(2);
  const [cars, setCars] = useState(1);
  const [weekend, setWeekend] = useState(false);
  // One quantity per package, indexed to pricing.ts — the server reads pack0,
  // pack1 … so a third package needs no change on either side.
  const [packs, setPacks] = useState<number[]>(() => tubingPricing.packages.map(() => 0));

  const carRate = weekend ? parkingPricing.weekend : parkingPricing.weekday;
  const total =
    tubingPricing.packages.reduce((sum, p, i) => sum + (packs[i] ?? 0) * p.price, 0) +
    cars * carRate;
  const rides = tubingPricing.packages.reduce((n, p, i) => n + (packs[i] ?? 0) * p.rides, 0);

  useEffect(() => {
    if (state.status === "ok") trackEvent("tubing_request_submitted", { form: "tubing" });
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
    <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-6 shadow-[var(--shadow-card)] sm:p-9">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">{t.eyebrow}</p>
      <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">{t.title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">{t.lead}</p>

      {/* Packages, not a weekday/weekend grid: the operator gave one price per
          package and no day band, so inventing two columns would invent a
          tariff that does not exist. */}
      <div className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.priceTitle}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          {tubingPricing.packages.map((p) => (
            <div key={p.rides} className="flex items-baseline justify-between border-b border-[color:var(--line)] px-4 py-3">
              <span className="text-sm text-[var(--ink)]">{t.packLabel(p.rides)}</span>
              <span className="font-serif text-lg font-bold text-[var(--ink)]">{money(p.price)}</span>
            </div>
          ))}
          {/* The entry fee DOES follow the day band even though the ride
              packages do not, so its two numbers have to be labelled — an
              unlabelled "50 000 / 100 000" under a heading that says "one
              price all week" reads as the weekday figure being the price. */}
          <div className="flex items-baseline justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3">
            <span className="text-sm text-[var(--ink)]">{t.entry}</span>
            <span className="text-right">
              <span className="font-serif text-lg font-bold text-[var(--ink)]">{money(parkingPricing.weekday)}</span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {text(priceLabels.weekdaysLabel, locale)}
              </span>
              <span className="mx-1.5 text-[var(--muted)]">·</span>
              <span className="font-serif text-lg font-bold text-[var(--accent-strong)]">{money(parkingPricing.weekend)}</span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                {text(priceLabels.weekendLabel, locale)}
              </span>
            </span>
          </div>
          <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">{t.seasonNote}</div>
        </div>
      </div>

      <form action={action} className="mt-7 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <DatePicker
          name="date"
          label={t.date}
          locale={locale}
          minToday
          onChange={(iso) => setWeekend(isWeekendISO(iso))}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {tubingPricing.packages.map((p, i) => (
            <label key={p.rides} className="block">
              <span className={labelCls}>
                {t.packLabel(p.rides)} ({money(p.price)})
              </span>
              <input
                name={`pack${i}`}
                type="number"
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                value={packs[i] ?? 0}
                onChange={(e) =>
                  setPacks((prev) => prev.map((v, j) => (j === i ? +e.target.value || 0 : v)))
                }
                className={field}
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>{t.guests}</span>
            <input name="guests" type="number" min={1} max={200} step={1}
              inputMode="numeric" value={guests} onChange={(e) => setGuests(+e.target.value || 0)}
              className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.cars}</span>
            <input name="cars" type="number" min={0} max={60} step={1}
              inputMode="numeric" value={cars} onChange={(e) => setCars(+e.target.value || 0)}
              className={field} />
          </label>
        </div>

        <div className="flex items-baseline justify-between rounded-2xl bg-[var(--accent)]/[0.08] px-4 py-3.5">
          <span className="text-sm font-semibold text-[var(--ink)]">
            {t.total}
            {rides > 0 && (
              <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                · {t.packLabel(rides)}
              </span>
            )}
          </span>
          <span className="font-serif text-2xl font-bold text-[var(--ink)]">
            {money(total)}{" "}
            <span className="text-sm font-bold text-[var(--muted)]">
              {text(priceLabels.currencyShort, locale)}
            </span>
          </span>
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
            <input name="phone" required type="tel" inputMode="tel" placeholder="+998 __ ___ __ __"
              autoComplete="tel" className={field} />
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

        <div className="pt-1">
          <button
            type="submit"
            disabled={pending}
            className="btn-press w-full rounded-2xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-8 py-4.5 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_30px_-8px_rgba(220,140,0,0.6)] transition-all hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-lg"
          >
            {pending ? t.sending : t.send}
          </button>
          <p className="mt-3 max-w-md text-xs leading-5 text-[var(--muted)]">{t.note}</p>
        </div>
      </form>
    </div>
  );
}
