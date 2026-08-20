"use client";

import { useActionState, useEffect, useState } from "react";
import { submitStayRequest, type StayRequestState } from "@/app/actions/stay-request";
import { CountInput } from "@/components/ui/CountInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { LegalConsentFields } from "@/components/ui/LegalConsentFields";
import { STAY_OPENS_AT } from "@/lib/stay-window";
import type { Locale } from "@/i18n/config";
import { PageContextFields } from "@/components/ui/PageContextFields";

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
    checking: "Проверяем свободные домики…",
    free: "Свободно на выбранные даты",
    busy: "На эти даты всё занято — выберите другие",
    priceFrom: "от",
    sum: "сум",
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
    checking: "Bo'sh uychalarni tekshiryapmiz…",
    free: "Tanlangan sanalarga bo'sh",
    busy: "Bu sanalarga hammasi band — boshqasini tanlang",
    priceFrom: "dan",
    sum: "so'm",
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
    checking: "Checking availability…",
    free: "Available for these dates",
    busy: "Fully booked for these dates — please pick others",
    priceFrom: "from",
    sum: "UZS",
  },
};

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
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
  const [checkout, setCheckout] = useState("");

  /**
   * Свободно ли на выбранные даты.
   *
   * Спрашиваем сразу, как только гость выбрал заезд: узнать «занято» после
   * заполнения всей формы — это зря потраченная минута и раздражение. Пока
   * ответа нет, отправку не блокируем: неизвестность не повод отказывать.
   */
  const [avail, setAvail] = useState<{ status: string; price?: number } | null>(null);
  const [checking, setChecking] = useState(false);
  /** Цены и занятость открытого месяца — их календарь рисует прямо в клетках. */
  const [calendar, setCalendar] = useState<Record<string, { price: number | null; free: boolean }>>({});
  const [month, setMonth] = useState("");
  // Считается один раз при монтировании: часы во время рендера — нечистый
  // вызов, и правило react-hooks/purity справедливо на это ругается.
  const [now] = useState(() => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10));


  useEffect(() => {

    // Полсекунды тишины: гость печатает дату руками, и стрелять запросом на
    // каждую цифру года — десять обращений к движку вместо одного.
    const timer = setTimeout(async () => {
      if (!checkin) {
        setAvail(null);
        return;
      }
      setChecking(true);
      try {
        const q = new URLSearchParams({ room, checkin, adults: String(adults) });
        if (checkout) q.set("checkout", checkout);
        const res = await fetch("/api/availability?" + q.toString(), { cache: "no-store" });
        setAvail(res.ok ? await res.json() : { status: "unknown" });
      } catch {
        // Сеть гостя — не повод мешать ему оставить заявку.
        setAvail({ status: "unknown" });
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [room, checkin, checkout, adults]);

  /**
   * Цены месяца, который гость открыл в календаре.
   *
   * Запрашиваются один раз на месяц и остаются в состоянии: гость листает
   * туда-сюда, и перезапрашивать при каждом движении стрелки значило бы
   * тридцать обращений к движку на один клик.
   */
  useEffect(() => {
    if (!month) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/calendar?room=${room}&month=${month}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { days: { date: string; price: number | null; free: boolean }[] };
        if (!alive) return;
        setCalendar((prev) => {
          const next = { ...prev };
          for (const d of data.days) next[d.date] = { price: d.price, free: d.free };
          return next;
        });
      } catch {
        // Календарь без цен всё ещё работает как календарь.
      }
    })();
    return () => {
      alive = false;
    };
  }, [room, month]);

  /** Занято — единственное состояние, при котором отправка блокируется. */
  const busy = avail?.status === "busy";

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
      <PageContextFields />
      <input type="hidden" name="locale" value={locale} />
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t.checkin}</span>
          {/* Свой календарь, а не браузерное поле: в клетках видна цена ночи и
              занятые дни, которые выбрать нельзя. Браузерный это не умеет. */}
          <DatePicker
            name="checkin"
            label={t.checkin}
            locale={locale}
            minToday
            days={calendar}
            onMonthChange={setMonth}
            onChange={setCheckin}
          />
        </label>
        <label className="block">
          <span className={labelCls}>
            {t.checkout} <span className="font-normal normal-case">· {t.optional}</span>
          </span>
          <DatePicker
            name="checkout"
            label={t.checkout}
            locale={locale}
            minToday
            days={calendar}
            onMonthChange={setMonth}
            onChange={setCheckout}
          />
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
      <div className="mt-5">
        <LegalConsentFields locale={locale} includeRefund />
      </div>

      {state.error ? (
        <p className="mt-4 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
      ) : null}

      {/*
        Ответ движка о выбранных датах.
        Показывается сразу после выбора заезда — узнать «занято» на последнем
        шаге, заполнив всю форму, гость воспринимает как обман. «Неизвестно»
        не показываем вовсе: строка «мы не смогли проверить» тревожит и ничего
        не даёт, а отправить в этом случае можно.
      */}
      {checking && (
        <p className="mt-5 text-sm font-semibold text-[var(--muted)]">{t.checking}</p>
      )}
      {!checking && avail?.status === "free" && (
        <p className="mt-5 rounded-xl bg-[var(--green,#3f7d52)]/12 px-4 py-2.5 text-sm font-bold text-[var(--green,#3f7d52)]">
          {t.free}
          {avail.price ? ` · ${t.priceFrom} ${avail.price.toLocaleString("ru-RU").replaceAll(",", " ")} ${t.sum}` : ""}
        </p>
      )}
      {!checking && busy && (
        <p className="mt-5 rounded-xl bg-[var(--rose,#b4413c)]/10 px-4 py-2.5 text-sm font-bold text-[var(--rose,#b4413c)]">
          {t.busy}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || busy}
        className="btn-press mt-6 w-full rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3.5 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.sending : t.send}
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-[var(--muted)]">{t.note}</p>
    </form>
  );
}
