"use client";

import { useActionState, useEffect, useState } from "react";
import { submitPoolRequest } from "@/app/actions/pool";
import { parkingPricing, poolPricing, priceLabels } from "@/content/pricing";
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
    adults: string;
    kids: string;
    toddlers: string;
    towels: string;
    cars: string;
    bungalow: string;
    bungalowNone: string;
    bungalow4: string;
    bungalow10: string;
    total: string;
    freeNote: string;
  }
> = {
  ru: {
    eyebrow: "Бассейн · летний сезон",
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
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
    priceTitle: "Стоимость",
    adults: "Взрослые и дети 15+",
    kids: "Дети 5–15 лет",
    toddlers: "Дети до 5 лет",
    towels: "Полотенца (30 000)",
    cars: "Автомобилей",
    bungalow: "Бунгало",
    bungalowNone: "Не нужно",
    bungalow4: "До 4 человек — 300 000",
    bungalow10: "До 10 человек — 500 000",
    total: "Предварительно к оплате",
    freeNote: "Гостям, проживающим в шале и глэмпинге, вход бесплатный. Дети до 5 лет — бесплатно в сопровождении взрослых. Аренда бунгало не включает входные билеты. Бассейн работает ежедневно 08:00–20:00.",
  },
  uz: {
    eyebrow: "Basseyn · yozgi mavsum",
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
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
    priceTitle: "Narxi",
    adults: "Kattalar va 15+ bolalar",
    kids: "5–15 yoshli bolalar",
    toddlers: "5 yoshgacha bolalar",
    towels: "Sochiq (30 000)",
    cars: "Avtomobillar",
    bungalow: "Bungalo",
    bungalowNone: "Kerak emas",
    bungalow4: "4 kishigacha — 300 000",
    bungalow10: "10 kishigacha — 500 000",
    total: "Taxminiy to'lov",
    freeNote: "Shale va glempingda turuvchilar uchun kirish bepul. 5 yoshgacha bolalar — kattalar bilan bepul. Bungalo ijarasi kirish chiptalarini o'z ichiga olmaydi. Basseyn har kuni 08:00–20:00.",
  },
  en: {
    eyebrow: "The pool · summer season",
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
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
    priceTitle: "Price",
    adults: "Adults and ages 15+",
    kids: "Children 5–15",
    toddlers: "Children under 5",
    towels: "Towels (30 000)",
    cars: "Cars",
    bungalow: "Bungalow",
    bungalowNone: "Not needed",
    bungalow4: "Up to 4 people — 300 000",
    bungalow10: "Up to 10 people — 500 000",
    total: "Estimated total",
    freeNote: "Free entry for chalet and glamping guests. Under-fives free with an adult. Bungalow rental does not include entry tickets. The pool is open daily 08:00–20:00.",
  },
};

type State = { status: "idle" | "ok" | "error"; message?: string };
const initialState: State = { status: "idle" };

/** See the note in TopchanRequestForm — an uncaught rejection loses the form. */
async function formAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const res = await submitPoolRequest(formData);
    return res.ok ? { status: "ok" } : { status: "error", message: res.error };
  } catch (e) {
    console.error("[pool] submit failed:", e);
    const locale = (formData.get("locale") as string | null) ?? "ru";
    return { status: "error", message: (COPY[locale as Locale] ?? COPY.ru).failed };
  }
}

const field =
  "w-full min-h-14 rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const labelCls =
  "mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]";

export function PoolRequestForm({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.ru;
  const [state, action, pending] = useActionState(formAction, initialState);

  // Mirrored in the server action, which recomputes everything from the posted
  // fields — this copy exists only so the guest sees the number before sending.
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [towels, setTowels] = useState(0);
  const [cars, setCars] = useState(1);
  const [bungalow, setBungalow] = useState("none");
  const [weekend, setWeekend] = useState(false);

  const adultRate = weekend ? poolPricing.adult.weekend : poolPricing.adult.weekday;
  const childRate = weekend ? poolPricing.child.weekend : poolPricing.child.weekday;
  const bungalowPrice =
    bungalow === "b4" ? poolPricing.extras.bungalow4
    : bungalow === "b10" ? poolPricing.extras.bungalow10
    : 0;
  const total =
    adults * adultRate +
    kids * childRate +
    towels * poolPricing.extras.towel +
    cars * (weekend ? parkingPricing.weekend : parkingPricing.weekday) +
    bungalowPrice;

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
    <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-6 shadow-[var(--shadow-card)] sm:p-9">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">{t.eyebrow}</p>
      <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">{t.title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">{t.lead}</p>

      {/* Four rates: two age bands × two day bands, straight off the operator's
          tariff poster. Free entry for staying guests and under-fives is stated
          under them, because those are the two things guests ask about most. */}
      <div className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.priceTitle}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-[color:var(--line)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <span />
            <span className="text-right">{text(poolPricing.weekdayLabel, locale)}</span>
            <span className="text-right text-[var(--accent-strong)]">{text(poolPricing.weekendLabel, locale)}</span>
          </div>
          {[
            [t.adults, poolPricing.adult] as const,
            [t.kids, poolPricing.child] as const,
          ].map(([label, band]) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 border-b border-[color:var(--line)] px-4 py-3 last:border-0">
              <span className="text-sm text-[var(--ink)]">{label}</span>
              <span className="text-right font-serif text-lg font-bold text-[var(--ink)]">{money(band.weekday)}</span>
              <span className="text-right font-serif text-lg font-bold text-[var(--accent-strong)]">{money(band.weekend)}</span>
            </div>
          ))}
          <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            {t.freeNote}
          </div>
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

        {/* The picker reports its own selection: it writes into a controlled
            hidden input, and React fires no DOM change event for that, so the
            old wrapping <div onChange> never heard a thing and the running
            total sat on the weekday rate even for a Saturday. */}
        <DatePicker
          name="date"
          label={t.date}
          locale={locale}
          minToday
          onChange={(iso) => setWeekend(isWeekendISO(iso))}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>{t.adults}</span>
            {/* No defaultValue beside a controlled value — React ignores it and
                warns; the initial number comes from useState above. */}
            <input name="guests" type="number" min={1} max={200} step={1}
              inputMode="numeric" value={adults} onChange={(e) => setAdults(+e.target.value || 0)}
              className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.kids}</span>
            <input name="kids" type="number" min={0} max={200} step={1}
              inputMode="numeric" value={kids} onChange={(e) => setKids(+e.target.value || 0)}
              className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.toddlers}</span>
            <input name="toddlers" type="number" min={0} max={50} step={1}
              inputMode="numeric" value={toddlers} onChange={(e) => setToddlers(+e.target.value || 0)}
              className={field} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>{t.towels}</span>
            <input name="towels" type="number" min={0} max={50} step={1}
              inputMode="numeric" value={towels} onChange={(e) => setTowels(+e.target.value || 0)}
              className={field} />
          </label>
          {/* Entry is charged per car to anyone not staying overnight, which a
              pool day-pass guest is. The topchan and tubing forms already
              counted it; without it here the quoted total was short by the
              entry fee and the guest found out at the gate. */}
          <label className="block">
            <span className={labelCls}>
              {t.cars} ({money(weekend ? parkingPricing.weekend : parkingPricing.weekday)})
            </span>
            <input name="cars" type="number" min={0} max={60} step={1}
              inputMode="numeric" value={cars} onChange={(e) => setCars(+e.target.value || 0)}
              className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.bungalow}</span>
            <select name="bungalow" value={bungalow} onChange={(e) => setBungalow(e.target.value)} className={field}>
              <option value="none">{t.bungalowNone}</option>
              <option value="b4">{t.bungalow4}</option>
              <option value="b10">{t.bungalow10}</option>
            </select>
          </label>
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

        {/* Note sits under the button, not beside it: the floating concierge
            bubble lives in the bottom-right corner and was covering it. */}
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
