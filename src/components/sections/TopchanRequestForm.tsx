"use client";

import { useActionState, useEffect, useState } from "react";
import { submitTopchanRequest } from "@/app/actions/topchan";
import { parkingPricing, poolPricing, priceLabels, priceList, topchanPricing } from "@/content/pricing";
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
    guestsHint: (n: number) => string;
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
    topchan: string;
    entry: string;
    allWeek: string;
    extrasTitle: string;
    poolTitle: string;
    poolAdults: string;
    poolKids: string;
    towels: string;
    total: string;
    freeNote: string;
  }
> = {
  ru: {
    eyebrow: `Топчан · ${topchanPricing.hours}`,
    title: "Оставить заявку",
    lead: "Выберите дату и число гостей — администратор перезвонит, подтвердит свободный топчан и забронирует его.",
    date: "Дата визита",
    guests: "Гостей",
    guestsHint: (n) => `Понадобится топчанов: ${n}`,
    cars: "Автомобилей",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    message: "Комментарий",
    messagePh: "Время приезда, пожелания…",
    send: "Отправить заявку",
    sending: "Отправляем…",
    successTitle: "Заявка принята",
    successText: "Администратор свяжется с вами в ближайшее время и подтвердит бронь.",
    note: "Заявка — это ещё не оплата. Бронь подтверждает администратор.",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
    priceTitle: "Стоимость",
    topchan: `Топчан (до ${topchanPricing.capacity} чел.)`,
    entry: "Въезд, 1 автомобиль",
    allWeek: "всю неделю",
    extrasTitle: "Добавить к отдыху",
    poolTitle: "Доступ в бассейн",
    poolAdults: "Взрослые и дети 15+",
    poolKids: "Дети 5–15 лет",
    towels: "Полотенца",
    total: "Предварительно к оплате",
    freeNote: `Топчан оплачивается целиком, не с человека: один вмещает до ${topchanPricing.capacity} гостей. Свои продукты и свой мангал привозить можно.`,
  },
  uz: {
    eyebrow: `Topchan · ${topchanPricing.hours}`,
    title: "Ariza qoldiring",
    lead: "Sana va mehmonlar sonini tanlang — administrator qo'ng'iroq qilib, bo'sh topchanni tasdiqlaydi va band qiladi.",
    date: "Tashrif sanasi",
    guests: "Mehmonlar",
    guestsHint: (n) => `Kerakli topchanlar: ${n}`,
    cars: "Avtomobillar",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    message: "Izoh",
    messagePh: "Kelish vaqti, tilaklar…",
    send: "Arizani yuborish",
    sending: "Yuborilmoqda…",
    successTitle: "Ariza qabul qilindi",
    successText: "Administrator tez orada bog'lanib, bronni tasdiqlaydi.",
    note: "Ariza — bu hali to'lov emas. Bronni administrator tasdiqlaydi.",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
    priceTitle: "Narxi",
    topchan: `Topchan (${topchanPricing.capacity} kishigacha)`,
    entry: "Kirish, 1 avtomobil",
    allWeek: "butun hafta",
    extrasTitle: "Dam olishga qo'shish",
    poolTitle: "Basseynga kirish",
    poolAdults: "Kattalar va 15+ bolalar",
    poolKids: "5–15 yoshli bolalar",
    towels: "Sochiqlar",
    total: "Taxminiy to'lov",
    freeNote: `Topchan bir kishidan emas, butunlay to'lanadi: bittasiga ${topchanPricing.capacity} kishigacha sig'adi. O'z mahsulotlaringiz va mangalingizni olib kelish mumkin.`,
  },
  en: {
    eyebrow: `Topchan · ${topchanPricing.hours}`,
    title: "Send a request",
    lead: "Pick a date and the number of guests — our administrator will call back, confirm a free topchan and hold it for you.",
    date: "Visit date",
    guests: "Guests",
    guestsHint: (n) => `Topchans needed: ${n}`,
    cars: "Cars",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    message: "Comment",
    messagePh: "Arrival time, preferences…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request received",
    successText: "Our administrator will contact you shortly to confirm the booking.",
    note: "A request is not a payment. The administrator confirms the booking.",
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
    priceTitle: "Price",
    topchan: `Topchan (up to ${topchanPricing.capacity} people)`,
    entry: "Entry, 1 car",
    allWeek: "all week",
    extrasTitle: "Add to your day",
    poolTitle: "Pool access",
    poolAdults: "Adults and ages 15+",
    poolKids: "Children 5–15",
    towels: "Towels",
    total: "Estimated total",
    freeNote: `A topchan is charged as a whole, not per person: one seats up to ${topchanPricing.capacity} guests. You may bring your own food and your own grill.`,
  },
};

type State = { status: "idle" | "ok" | "error"; message?: string };
const initialState: State = { status: "idle" };

/**
 * A rejection here — a dropped connection on a mountain road, a redeploy while
 * the page was open — would propagate out of useActionState and be re-thrown
 * during render, handing the whole page to the error boundary and taking the
 * guest's name, phone and date with it. Caught, it becomes a message beside a
 * form that still holds everything they typed.
 */
async function formAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const res = await submitTopchanRequest(formData);
    return res.ok ? { status: "ok" } : { status: "error", message: res.error };
  } catch (e) {
    console.error("[topchan] submit failed:", e);
    const locale = (formData.get("locale") as string | null) ?? "ru";
    return { status: "error", message: (COPY[locale as Locale] ?? COPY.ru).failed };
  }
}

const field =
  "w-full min-h-14 rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const labelCls =
  "mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]";

/** The cooking rentals, in the order the operator's poster lists them. */
const EXTRA_KEYS = ["kazan", "mangal", "firewood", "charcoal"] as const;

export function TopchanRequestForm({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.ru;
  const [state, action, pending] = useActionState(formAction, initialState);

  // Mirrored in the server action, which recomputes everything from the posted
  // fields — this copy exists only so the guest sees the number before sending.
  const [guests, setGuests] = useState(8);
  const [cars, setCars] = useState(1);
  const [weekend, setWeekend] = useState(false);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [poolAdults, setPoolAdults] = useState(0);
  const [poolKids, setPoolKids] = useState(0);
  const [towels, setTowels] = useState(0);

  const band = <T extends { weekday: number; weekend: number }>(x: T) =>
    weekend ? x.weekend : x.weekday;

  // A party of nine needs two topchans — derived, never asked, so nobody has to
  // work out that the price is per platform rather than per head.
  const topchans = Math.max(Math.ceil(guests / topchanPricing.capacity), 1);

  const total =
    topchans * band(topchanPricing.rent) +
    cars * band(parkingPricing) +
    poolAdults * band(poolPricing.adult) +
    poolKids * band(poolPricing.child) +
    towels * poolPricing.extras.towel +
    EXTRA_KEYS.reduce((sum, key) => {
      const item = priceList.find((p) => p.key === key);
      return item ? sum + (extras[key] ?? 0) * band(item) : sum;
    }, 0);

  useEffect(() => {
    if (state.status === "ok") trackEvent("topchan_request_submitted", { form: "topchan" });
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

      {/* The topchan and the entry fee double at the weekend; the grill, the
          firewood and the charcoal cost the same seven days a week. Printing
          two identical columns for those reads as a bug, so they collapse to
          one number labelled "all week". */}
      <div className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.priceTitle}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-[color:var(--line)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <span />
            <span className="text-right">{text(priceLabels.weekdaysLabel, locale)}</span>
            <span className="text-right text-[var(--accent-strong)]">{text(priceLabels.weekendLabel, locale)}</span>
          </div>
          {[
            [t.topchan, topchanPricing.rent] as const,
            [t.entry, parkingPricing] as const,
          ].map(([label, rate]) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 border-b border-[color:var(--line)] px-4 py-3">
              <span className="text-sm text-[var(--ink)]">{label}</span>
              <span className="text-right font-serif text-lg font-bold text-[var(--ink)]">{money(rate.weekday)}</span>
              <span className="text-right font-serif text-lg font-bold text-[var(--accent-strong)]">{money(rate.weekend)}</span>
            </div>
          ))}
          {EXTRA_KEYS.map((key) => {
            const item = priceList.find((p) => p.key === key);
            if (!item) return null;
            const flat = item.weekday === item.weekend;
            return (
              <div key={key} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 border-b border-[color:var(--line)] px-4 py-3">
                <span className="text-sm text-[var(--ink)]">
                  {item.title[locale]}
                  {item.subtitle ? <span className="text-[var(--muted)]"> · {item.subtitle[locale]}</span> : null}
                </span>
                {flat ? (
                  <span className="col-span-2 text-right font-serif text-lg font-bold text-[var(--ink)]">
                    {money(item.weekday)}{" "}
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.allWeek}</span>
                  </span>
                ) : (
                  <>
                    <span className="text-right font-serif text-lg font-bold text-[var(--ink)]">{money(item.weekday)}</span>
                    <span className="text-right font-serif text-lg font-bold text-[var(--accent-strong)]">{money(item.weekend)}</span>
                  </>
                )}
              </div>
            );
          })}
          <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">{t.freeNote}</div>
        </div>
      </div>

      <form action={action} className="mt-7 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {/* Honeypot — invisible to humans, filled only by bots */}
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
          <label className="block">
            <span className={labelCls}>{t.guests}</span>
            <input name="guests" type="number" min={1} max={240} step={1}
              inputMode="numeric" value={guests} onChange={(e) => setGuests(+e.target.value || 0)}
              className={field} />
            <span className="mt-1.5 block text-xs font-semibold text-[var(--accent-strong)]">
              {t.guestsHint(topchans)}
            </span>
          </label>
          <label className="block">
            <span className={labelCls}>{t.cars}</span>
            <input name="cars" type="number" min={0} max={60} step={1}
              inputMode="numeric" value={cars} onChange={(e) => setCars(+e.target.value || 0)}
              className={field} />
          </label>
        </div>

        {/* Upsells. Everything here is optional and starts at zero, so the
            total a guest sees before touching them is the plain topchan price. */}
        <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.extrasTitle}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EXTRA_KEYS.map((key) => {
              const item = priceList.find((p) => p.key === key);
              if (!item) return null;
              return (
                <label key={key} className="block">
                  <span className={labelCls}>
                    {item.title[locale]} ({money(band(item))})
                  </span>
                  <input
                    name={key}
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    inputMode="numeric"
                    value={extras[key] ?? 0}
                    onChange={(e) => setExtras((x) => ({ ...x, [key]: +e.target.value || 0 }))}
                    className={field}
                  />
                </label>
              );
            })}
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.poolTitle}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>{t.poolAdults} ({money(band(poolPricing.adult))})</span>
              <input name="poolAdults" type="number" min={0} max={200} step={1}
                inputMode="numeric" value={poolAdults} onChange={(e) => setPoolAdults(+e.target.value || 0)}
                className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>{t.poolKids} ({money(band(poolPricing.child))})</span>
              <input name="poolKids" type="number" min={0} max={200} step={1}
                inputMode="numeric" value={poolKids} onChange={(e) => setPoolKids(+e.target.value || 0)}
                className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>{t.towels} ({money(poolPricing.extras.towel)})</span>
              <input name="towels" type="number" min={0} max={50} step={1}
                inputMode="numeric" value={towels} onChange={(e) => setTowels(+e.target.value || 0)}
                className={field} />
            </label>
          </div>
        </div>

        {/* Running total. The administrator confirms it, but a guest should not
            have to do this arithmetic in their head before pressing send. */}
        <div className="flex items-baseline justify-between rounded-2xl bg-[var(--accent)]/[0.08] px-4 py-3.5">
          <span className="text-sm font-semibold text-[var(--ink)]">{t.total}</span>
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
