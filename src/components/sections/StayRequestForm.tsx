"use client";

import { useActionState, useState } from "react";
import { submitStayRequest, type StayRequestState } from "@/app/actions/stay-request";
import { CountInput } from "@/components/ui/CountInput";
import { Icon } from "@/components/ui/Icon";
import { STAY_OPENS_AT } from "@/lib/stay-window";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

/**
 * Заявка на проживание, прямо на странице домика.
 *
 * Кнопка «Забронировать» вела в движок Exely — гость попадал в чужой интерфейс,
 * где нужно разобраться с тарифами и заполнить длинную форму. Здесь пять полей
 * и одна кнопка, а дальше с гостем говорит человек. Движок никуда не делся: он
 * по-прежнему на /bron для тех, кто хочет оформить всё сам.
 */
const COPY: Record<Locale, Record<string, string>> = {
  ru: {
    title: "Забронировать в один клик",
    lead: "Оставьте заявку — перезвоним, подтвердим свободные даты и рассчитаем стоимость.",
    checkin: "Заезд",
    checkout: "Выезд",
    optional: "необязательно",
    adults: "Взрослых",
    kids: "Детей",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    email: "Почта",
    comment: "Комментарий",
    commentPh: "Пожелания: этаж, время заезда, дополнительное место",
    send: "Отправить заявку",
    sending: "Отправляем…",
    done: "Заявка принята",
    doneLead: "Мы свяжемся с вами, чтобы подтвердить даты и стоимость.",
    note: "Заявка не является бронированием: домик закрепляется за вами после оплаты.",
    opens: "Заезды принимаем с 15 августа — более ранние даты закрыты.",
    consentBefore: "Я ознакомился с",
    consentOffer: "публичной офертой",
    consentAnd: "и",
    consentRefund: "правилами отмены и возврата",
    consentAfter: " и согласен с ними.",
  },
  uz: {
    title: "Bir marta bosib bron qilish",
    lead: "Ariza qoldiring — qo'ng'iroq qilamiz, bo'sh sanalarni tasdiqlaymiz va narxni hisoblaymiz.",
    checkin: "Kirish",
    checkout: "Chiqish",
    optional: "majburiy emas",
    adults: "Kattalar",
    kids: "Bolalar",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    email: "Pochta",
    comment: "Izoh",
    commentPh: "Istaklar: kirish vaqti, qo'shimcha joy",
    send: "Ariza yuborish",
    sending: "Yuborilmoqda…",
    done: "Ariza qabul qilindi",
    doneLead: "Sanalar va narxni tasdiqlash uchun siz bilan bog'lanamiz.",
    note: "Ariza bron emas: uycha to'lovdan keyin sizga biriktiriladi.",
    opens: "Kirish 15-avgustdan qabul qilinadi — undan oldingi sanalar yopiq.",
    consentBefore: "Men",
    consentOffer: "ommaviy oferta",
    consentAnd: "va",
    consentRefund: "bekor qilish va qaytarish qoidalari",
    consentAfter: " bilan tanishdim va roziman.",
  },
  en: {
    title: "Book in one click",
    lead: "Send a request — we will call back, confirm the dates and quote the price.",
    checkin: "Check-in",
    checkout: "Check-out",
    optional: "optional",
    adults: "Adults",
    kids: "Children",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    email: "Email",
    comment: "Comment",
    commentPh: "Requests: arrival time, extra bed",
    send: "Send request",
    sending: "Sending…",
    done: "Request received",
    doneLead: "We will get in touch to confirm the dates and the price.",
    note: "A request is not a booking: the cabin is held for you once it is paid.",
    opens: "Arrivals from 15 August — earlier dates are closed.",
    consentBefore: "I have read the",
    consentOffer: "public offer",
    consentAnd: "and the",
    consentRefund: "cancellation and refund rules",
    consentAfter: " and I agree to them.",
  },
};

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const link =
  "font-semibold text-[var(--accent-strong)] underline underline-offset-2 transition-colors hover:text-[var(--sun-dark)]";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

export function StayRequestForm({
  locale,
  room,
  maxGuests,
}: {
  locale: Locale;
  /** Слаг домика — сервер сверяет его со списком и берёт название оттуда. */
  room: string;
  maxGuests: number;
}) {
  const t = COPY[locale];
  const [state, action, pending] = useActionState<StayRequestState, FormData>(submitStayRequest, {});
  // Счётчики держат своё состояние: CountInput управляемый и позволяет стереть
  // ноль, а не объезжать его стрелками.
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  // Выезд не раньше заезда — браузер сам не даст выбрать неверную дату.
  const [checkin, setCheckin] = useState("");
  // Считается один раз при монтировании: часы во время рендера — нечистый
  // вызов, и правило react-hooks/purity справедливо на это ругается.
  const [now] = useState(() => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10));
  // Раньше открытия продаж календарь дат не предлагает вовсе — отказ после
  // заполнения формы гость воспринимает как поломку, а не как правило.
  const today = now > STAY_OPENS_AT ? now : STAY_OPENS_AT;

  if (state.ok) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-8 text-center">
        <Icon name="check" className="mx-auto h-10 w-10 text-[var(--accent-strong)]" />
        <p className="mt-4 font-serif text-2xl font-bold text-[var(--ink)]">{t.done}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{t.doneLead}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="font-serif text-2xl font-bold text-[var(--ink)] sm:text-3xl">{t.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t.lead}</p>
      {/* Правило видно до того, как гость начал заполнять: календарь ранние даты
          и так не предложит, но человек должен понимать почему. */}
      {now < STAY_OPENS_AT && (
        <p className="mt-3 rounded-xl bg-[var(--sun)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--sun-dark)]">
          {t.opens}
        </p>
      )}

      <input type="hidden" name="room" value={room} />
      <input type="hidden" name="locale" value={locale} />
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t.checkin}</span>
          <input
            name="checkin"
            type="date"
            required
            min={today}
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span className={labelCls}>
            {t.checkout} <span className="font-normal normal-case">· {t.optional}</span>
          </span>
          <input name="checkout" type="date" min={checkin || today} className={field} />
        </label>

        <label className="block">
          <span className={labelCls}>{t.adults}</span>
          <CountInput name="adults" min={1} max={maxGuests} value={adults} onValue={setAdults} className={field} />
        </label>
        <label className="block">
          <span className={labelCls}>{t.kids}</span>
          <CountInput name="kids" min={0} max={maxGuests} value={kids} onValue={setKids} className={field} />
        </label>

        <label className="block">
          <span className={labelCls}>{t.name}</span>
          <input name="name" required placeholder={t.namePh} autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={labelCls}>{t.phone}</span>
          <input
            name="phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="+998 __ ___ __ __"
            autoComplete="tel"
            className={field}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelCls}>
            {t.email} <span className="font-normal normal-case">· {t.optional}</span>
          </span>
          <input name="email" type="email" autoComplete="email" placeholder="mail@example.com" className={field} />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelCls}>
            {t.comment} <span className="font-normal normal-case">· {t.optional}</span>
          </span>
          <textarea name="comment" rows={3} placeholder={t.commentPh} className={`${field} resize-none`} />
        </label>
      </div>

      {/* Галочка перед кнопкой, а не после: согласие даётся до действия.
          Ссылки открываются в новой вкладке — уходя читать оферту, гость не
          должен терять заполненную форму. */}
      <label className="mt-5 flex items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--sun)]"
        />
        <span className="text-sm leading-6 text-[var(--muted)]">
          {t.consentBefore}{" "}
          <a href={localizePath(locale, "/legal/public-offer")} target="_blank" rel="noopener noreferrer" className={link}>
            {t.consentOffer}
          </a>{" "}
          {t.consentAnd}{" "}
          <a href={localizePath(locale, "/legal/payment-refund")} target="_blank" rel="noopener noreferrer" className={link}>
            {t.consentRefund}
          </a>
          {t.consentAfter}
        </span>
      </label>

      {state.error ? (
        <p className="mt-4 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-press mt-6 w-full rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3.5 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.sending : t.send}
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-[var(--muted)]">{t.note}</p>
    </form>
  );
}
