"use client";

import { Fragment, useActionState, useEffect, useState } from "react";

// Обрезка по [0, max] переехала внутрь CountInput вместе с самими счётчиками.
import { submitPoolRequest } from "@/app/actions/pool";
import { poolFacts, poolPricing, priceLabels } from "@/content/pricing";
import { resolvePricing, type LivePricing } from "@/lib/pricing-resolve";
import { contacts } from "@/content/contacts";
import { CountInput } from "@/components/ui/CountInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { LegalConsentFields } from "@/components/ui/LegalConsentFields";
import { trackEvent } from "@/lib/analytics";
import { text } from "@/lib/localize";
import { isWeekendISO, money } from "@/lib/tariff";
import type { Locale } from "@/i18n/config";

/**
 * Имя, вместимость и наличный фонд каждого типа бунгало.
 *
 * Через сокращение, потому что подписи полей и примечание под формой печатают
 * все три числа по три раза — по разу на локаль. Написать «8 Standard» руками
 * значило бы завести четвёртое место, где живёт лимит брони, и разойтись с
 * тремя остальными: max у поля, потолок в серверном экшене и брифинг ИИ.
 */
const B = poolFacts.bungalows;

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
    bungalowSmall: string;
    bungalowLarge: string;
    total: string;
    freeNote: string;
    parkingNote: string;
    dressCode: string;
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
    note: "Заявка — это ещё не оплата. Место закрепляет администратор: пока он не подтвердил, бронь не оформлена. Приехавшим без заявки свободное место у бассейна не гарантировано.",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
    priceTitle: "Стоимость",
    adults: "Взрослые и дети 15+",
    kids: "Дети 5–15 лет",
    toddlers: "Дети до 5 лет",
    towels: "Полотенца (30 000)",
    /**
     * Название и вместимость — и всё.
     *
     * Раньше в подписи было ещё и наличие: «Бунгало Standard, до 4 чел.
     * (8 шт.) (300 000)». Рядом с ценой это читается как четыре числа подряд,
     * из которых гостю в момент выбора нужны два. Сколько их всего, сказано
     * ниже в примечании и всё равно жёстко ограничено полем ввода.
     */
    bungalowSmall: `Бунгало ${B.small.name}, до ${B.small.capacity} чел.`,
    bungalowLarge: `Бунгало ${B.large.name}, до ${B.large.capacity} чел.`,
    // Kept short on purpose: the select is the third cell of a three-column
    // row inside a max-w-3xl card, so it never gets more than ~170 px of text
    // room — the old labels had their price cut off at every screen width.
    total: "Предварительно к оплате",
    freeNote: `Вход для посетителей бассейна БЕСПЛАТНЫЙ. Гостям, проживающим в шале и глэмпинге, вход тоже бесплатный. Дети до 5 лет — бесплатно в сопровождении взрослых. Бунгало ${B.small.name} (до ${B.small.capacity} чел.) на территории ${B.small.count}, ${B.large.name} (до ${B.large.capacity} чел.) — ${B.large.count}; больше этого числа заказать нельзя. Аренда бунгало не включает входные билеты. Бассейн работает ежедневно ${poolPricing.hours} для посетителей и с ${poolPricing.hoursForStayingGuests} для проживающих в шале и глэмпинге. Со своей едой и напитками в зону бассейна нельзя — на территории работают пул-бар и ресторан.`,
    parkingNote: "Парковка для посетителей бассейна бесплатная.",
    dressCode:
      "Дресс-код на территории: в купальных костюмах разрешено находиться только в зоне бассейна. По территории курорта — кафе, ресепшен, магазин, общие зоны — в одежде и обуви.",
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
    note: "Ariza — bu hali to'lov emas. Joyni administrator biriktiradi: u tasdiqlamaguncha bron rasmiylashtirilmagan. Arizasiz kelganlarga basseynda bo'sh joy kafolatlanmaydi.",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
    priceTitle: "Narxi",
    adults: "Kattalar va 15+ bolalar",
    kids: "5–15 yoshli bolalar",
    toddlers: "5 yoshgacha bolalar",
    towels: "Sochiq (30 000)",
    bungalowSmall: `${B.small.name} bungalo, ${B.small.capacity} kishigacha`,
    bungalowLarge: `${B.large.name} bungalo, ${B.large.capacity} kishigacha`,
    total: "Taxminiy to'lov",
    freeNote: `Basseyn mehmonlari uchun kirish BEPUL. Shale va glempingda turuvchilar uchun kirish ham bepul. 5 yoshgacha bolalar — kattalar bilan bepul. Hududda ${B.small.count} ta ${B.small.name} bungalo (${B.small.capacity} kishigacha) va ${B.large.count} ta ${B.large.name} (${B.large.capacity} kishigacha) bor; bundan ko'pini buyurtma qilib bo'lmaydi. Bungalo ijarasi kirish chiptalarini o'z ichiga olmaydi. Basseyn tashrif buyuruvchilar uchun har kuni ${poolPricing.hours}, shale va glempingda yashovchilar uchun ${poolPricing.hoursForStayingGuests}. Basseyn hududiga o'z ovqatingiz va ichimliklaringiz bilan kirish mumkin emas — hududda pul-bar va restoran ishlaydi.`,
    parkingNote: "Basseyn mehmonlari uchun avtoturargoh bepul.",
    dressCode:
      "Hududdagi dress-kod: cho'milish kiyimida faqat basseyn zonasida bo'lish mumkin. Kurort hududi bo'ylab — kafe, resepshn, do'kon, umumiy zonalar — kiyim va oyoq kiyimda yuriladi.",
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
    note: "A request is not a payment. The administrator holds your place: until they confirm, nothing is booked. If you arrive without a request, a free spot at the pool is not guaranteed.",
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
    priceTitle: "Price",
    adults: "Adults and ages 15+",
    kids: "Children 5–15",
    toddlers: "Children under 5",
    towels: "Towels (30 000)",
    bungalowSmall: `${B.small.name} bungalow, up to ${B.small.capacity}`,
    bungalowLarge: `${B.large.name} bungalow, up to ${B.large.capacity}`,
    total: "Estimated total",
    freeNote: `Entry is FREE for pool visitors. Chalet and glamping guests get in free too. Under-fives free with an adult. There are ${B.small.count} ${B.small.name} bungalows (up to ${B.small.capacity} guests) and ${B.large.count} ${B.large.name} ones (up to ${B.large.capacity}) on site; you cannot book more than that. Bungalow rental does not include entry tickets. The pool is open ${poolPricing.hours} for visitors and ${poolPricing.hoursForStayingGuests} for chalet and glamping guests. Outside food and drink are not allowed in the pool area — the pool bar and the restaurant are on site.`,
    parkingNote: "Parking is free for pool visitors.",
    dressCode:
      "Dress code on site: swimwear may be worn in the pool area only. Elsewhere on the resort — café, reception, shop, common areas — please wear clothes and footwear.",
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

export function PoolRequestForm({
  locale,
  pricing,
}: {
  locale: Locale;
  /**
 * Live tariff. Defaults to the code's constants, so this component still
 * renders standalone (tests, storybook) without a server round-trip.
 */
  pricing?: LivePricing;
}) {
  const live = pricing ?? resolvePricing();
  const t = COPY[locale] ?? COPY.ru;
  const [state, action, pending] = useActionState(formAction, initialState);

  // Mirrored in the server action, which recomputes everything from the posted
  // fields — this copy exists only so the guest sees the number before sending.
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [towels, setTowels] = useState(0);
  const [bungalowSmall, setBungalowSmall] = useState(0);
  const [bungalowLarge, setBungalowLarge] = useState(0);
  const [weekend, setWeekend] = useState(false);

  const adultRate = weekend ? live.pool.adult.weekend : live.pool.adult.weekday;
  const childRate = weekend ? live.pool.child.weekend : live.pool.child.weekday;
  const bungalowPrice =
    bungalowSmall * live.pool.extras.bungalow4 + bungalowLarge * live.pool.extras.bungalow10;
  const total =
    adults * adultRate +
    kids * childRate +
    towels * live.pool.extras.towel +
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
        {/* ONE grid for the header and every price row.
            Each row used to be its own grid, and an `auto` track sizes to that
            row's own content — so the header's tracks were sized by
            "Пт–Вс и праздники" and the price tracks by "200 000", and the
            column headings could never sit above their own numbers. */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          <div className="grid grid-cols-[1fr_auto_auto] px-4">
            <span className="border-b border-[color:var(--line)] py-2.5" />
            <span className="border-b border-[color:var(--line)] py-2.5 pl-4 text-right text-[11px] font-bold uppercase leading-tight tracking-wider text-[var(--muted)]">
              {text(poolPricing.weekdayLabel, locale)}
            </span>
            <span className="border-b border-[color:var(--line)] py-2.5 pl-4 text-right text-[11px] font-bold uppercase leading-tight tracking-wider text-[var(--accent-strong)]">
              {text(poolPricing.weekendLabel, locale)}
            </span>

            {[
              [t.adults, live.pool.adult] as const,
              [t.kids, live.pool.child] as const,
            ].map(([label, band]) => (
              <Fragment key={label}>
                <span className="border-b border-[color:var(--line)] py-3 pr-2 text-sm text-[var(--ink)]">{label}</span>
                <span className="border-b border-[color:var(--line)] py-3 pl-4 text-right font-serif text-lg font-bold text-[var(--ink)]">
                  {money(band.weekday)}
                </span>
                <span className="border-b border-[color:var(--line)] py-3 pl-4 text-right font-serif text-lg font-bold text-[var(--accent-strong)]">
                  {money(band.weekend)}
                </span>
              </Fragment>
            ))}
          </div>
          <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            {t.freeNote}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-[color:var(--sun)]/45 bg-[var(--sun)]/10 px-4 py-3 text-sm leading-6 text-[var(--ink)]">
        <strong>{t.parkingNote}</strong>
      </p>

      {/* Дресс-код рядом с парковкой, а не в мелком тексте тарифа: правило, о
          котором узнают на ресепшене, — это испорченный день гостю и разговор
          администратору. Оба уведомления одинаково заметны. */}
      <p className="mt-3 rounded-2xl border border-[color:var(--sun)]/45 bg-[var(--sun)]/10 px-4 py-3 text-sm leading-6 text-[var(--ink)]">
        <strong>{t.dressCode}</strong>
      </p>

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
            <CountInput name="guests" min={1} max={200} value={adults} onValue={setAdults} className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.kids}</span>
            <CountInput name="kids" max={200} value={kids} onValue={setKids} className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t.toddlers}</span>
            <CountInput name="toddlers" max={50} value={toddlers} onValue={setToddlers} className={field} />
          </label>
        </div>

        {/* No parking field: parking is free for pool bookings, for staying
            guests and for topchan visitors — only tubing pays for it. It was
            briefly charged here, which overstated the total by the day band. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>{t.towels}</span>
            <CountInput name="towels" max={50} value={towels} onValue={setTowels} className={field} />
          </label>
          {/* Два счётчика вместо «одно из»: ограничить нечего, пока заказать
              можно ровно одно. max — подсказка, настоящий потолок в экшене. */}
          <label className="block">
            <span className={labelCls}>
              {t.bungalowSmall} ({money(live.pool.extras.bungalow4)})
            </span>
            <CountInput name="bungalowSmall" max={B.small.count} value={bungalowSmall} onValue={setBungalowSmall} className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>
              {t.bungalowLarge} ({money(live.pool.extras.bungalow10)})
            </span>
            <CountInput name="bungalowLarge" max={B.large.count} value={bungalowLarge} onValue={setBungalowLarge} className={field} />
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

        <LegalConsentFields locale={locale} includePoolRules />

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
