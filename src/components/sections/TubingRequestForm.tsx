"use client";

import { useActionState, useEffect, useState } from "react";
import { submitTubingRequest } from "@/app/actions/tubing";
import { priceLabels } from "@/content/pricing";
import { tubingPricing } from "@/content/pricing";
import { tubing100cmFormSummary, tubing100cmSummaryTitle } from "@/content/tubing-100cm-rules";
import { resolvePricing, type LivePricing } from "@/lib/pricing-resolve";
import { contacts } from "@/content/contacts";
import { CountInput } from "@/components/ui/CountInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { clock } from "@/components/ui/Clock";
import { LegalConsentFields } from "@/components/ui/LegalConsentFields";
import { trackEvent } from "@/lib/analytics";
import { list, text } from "@/lib/localize";
import { money, ridesRu } from "@/lib/tariff";
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
    packLabel: (rides: number) => string;
    parkingNote: (price: string) => string;
    total: string;
    seasonNote: string;
  }
> = {
  ru: {
    eyebrow: `Тюбинг-горка · ${tubingPricing.hours}`,
    title: "Оставить заявку",
    lead: "Выберите дату и количество спусков — администратор перезвонит, подтвердит время и состояние трассы.",
    date: "Дата визита",
    guests: "Гостей",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    message: "Комментарий",
    messagePh: "Время приезда, возраст детей…",
    send: "Отправить заявку",
    sending: "Отправляем…",
    successTitle: "Заявка принята",
    successText: "Администратор свяжется с вами в ближайшее время и подтвердит бронь.",
    note: `Заявка — это ещё не оплата. Бронь подтверждает администратор. Горка работает ${tubingPricing.hours}; спуск — только в присутствии инструктора и по его разрешению.`,
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
    priceTitle: "Тариф",
    packLabel: (r) => `${r} ${ridesRu(r)}`,
    parkingNote: (price) => `Парковка платная — ${price} сум за автомобиль. Оплачивается отдельно и не входит в сумму заявки.`,
    total: "Предварительно к оплате",
    seasonNote:
      "Цена пакетов одинаковая в будни и выходные. Трасса всесезонная, 160 м, с автоматическим подъёмом — одновременно спускаются до 5 человек.",
  },
  uz: {
    eyebrow: `Tubing gorkasi · ${tubingPricing.hours}`,
    title: "Ariza qoldiring",
    lead: "Sana va uchishlar sonini tanlang — administrator qo'ng'iroq qilib, vaqtni va trassa holatini tasdiqlaydi.",
    date: "Tashrif sanasi",
    guests: "Mehmonlar",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    message: "Izoh",
    messagePh: "Kelish vaqti, bolalar yoshi…",
    send: "Arizani yuborish",
    sending: "Yuborilmoqda…",
    successTitle: "Ariza qabul qilindi",
    successText: "Administrator tez orada bog'lanib, bronni tasdiqlaydi.",
    note: `Ariza — bu hali to'lov emas. Bronni administrator tasdiqlaydi. Gorka ${tubingPricing.hours} ishlaydi; uchish faqat instruktor ishtirokida va uning ruxsati bilan.`,
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
    priceTitle: "Tarif",
    packLabel: (r) => `${r} marta uchish`,
    parkingNote: (price) => `Avtoturargoh pullik — har bir avtomobil uchun ${price} so'm. Alohida to'lanadi va ariza summasiga kiritilmaydi.`,
    total: "Taxminiy to'lov",
    seasonNote:
      "Paket narxi ish kunlari va dam olish kunlarida bir xil. Trassa butun mavsumga mo'ljallangan, 160 m, avtomatik ko'targich bilan — bir vaqtda 5 kishigacha tushadi.",
  },
  en: {
    eyebrow: `Tubing hill · ${tubingPricing.hours}`,
    title: "Send a request",
    lead: "Pick a date and how many rides — our administrator will call back to confirm the time and the state of the track.",
    date: "Visit date",
    guests: "Guests",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    message: "Comment",
    messagePh: "Arrival time, children's ages…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request received",
    successText: "Our administrator will contact you shortly to confirm the booking.",
    note: `A request is not a payment. The administrator confirms the booking. The hill runs ${tubingPricing.hours}; descents happen only with the instructor present and on their signal.`,
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
    priceTitle: "Tariff",
    packLabel: (r) => `${r} rides`,
    parkingNote: (price) => `Parking is paid — ${price} UZS per car. It is paid separately and is not included in the request total.`,
    total: "Estimated total",
    seasonNote:
      "Package prices are the same all week. The track is all-season, 160 m, with a powered lift — up to 5 people descend at once.",
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
export function TubingRequestForm({
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

  const [guests, setGuests] = useState(2);
  // One quantity per package, indexed to pricing.ts — the server reads pack0,
  // pack1 … so a third package needs no change on either side.
  const [packs, setPacks] = useState<number[]>(() => live.tubing.packages.map(() => 0));

  const total = live.tubing.packages.reduce((sum, p, i) => sum + (packs[i] ?? 0) * p.price, 0);
  const rides = live.tubing.packages.reduce((n, p, i) => n + (packs[i] ?? 0) * p.rides, 0);

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
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">{clock(t.eyebrow)}</p>
      <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">{t.title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">{t.lead}</p>

      {/* Packages, not a weekday/weekend grid: the operator gave one price per
          package and no day band, so inventing two columns would invent a
          tariff that does not exist. */}
      <div className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{t.priceTitle}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
          {live.tubing.packages.map((p) => (
            <div key={p.rides} className="flex items-baseline justify-between border-b border-[color:var(--line)] px-4 py-3">
              <span className="text-sm text-[var(--ink)]">{t.packLabel(p.rides)}</span>
              <span className="font-serif text-lg font-bold text-[var(--ink)]">{money(p.price)}</span>
            </div>
          ))}
          <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">{t.seasonNote}</div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-[color:var(--sun)]/45 bg-[var(--sun)]/10 px-4 py-3 text-sm leading-6 text-[var(--ink)]">
        <strong>{t.parkingNote(money(live.parking))}</strong>
      </p>

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
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {live.tubing.packages.map((p, i) => (
            <label key={p.rides} className="block">
              <span className={labelCls}>
                {t.packLabel(p.rides)} ({money(p.price)})
              </span>
              <CountInput
                name={`pack${i}`}
                max={100}
                value={packs[i] ?? 0}
                onValue={(v) => setPacks((prev) => prev.map((old, j) => (j === i ? v : old)))}
                className={field}
              />
            </label>
          ))}
        </div>

        <label className="block sm:max-w-sm">
          <span className={labelCls}>{t.guests}</span>
          <CountInput name="guests" min={1} max={200} value={guests} onValue={setGuests} className={field} />
        </label>

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

        <div className="rounded-2xl border border-[color:var(--sun)]/55 bg-[var(--sun)]/10 px-4 py-4 text-[var(--ink)]">
          <p className="text-sm font-extrabold">{text(tubing100cmSummaryTitle, locale)}</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6">
            {list(tubing100cmFormSummary, locale).map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-[var(--sun-dark)]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Согласие находится внутри самой формы и до кнопки. Оба документа
            открываются отдельно, чтобы введённые дата и телефон не пропали,
            пока гость читает длинные правила. */}
        <LegalConsentFields locale={locale} includeTubingRules />

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
          <p className="mt-3 max-w-md text-xs leading-5 text-[var(--muted)]">{clock(t.note)}</p>
        </div>
      </form>
    </div>
  );
}
