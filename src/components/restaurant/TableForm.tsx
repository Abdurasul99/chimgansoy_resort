"use client";

import { useMemo, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { submitRestaurantTable } from "@/app/actions/restaurant";
import { trackEvent } from "@/lib/analytics";
import { DatePicker } from "@/components/ui/DatePicker";
import { CountInput } from "@/components/ui/CountInput";
import { PageContextFields } from "@/components/ui/PageContextFields";
import { TABLE_MAX_AHEAD_DAYS, addDaysISO, normalizePhone, tashkentNow, timeSlots } from "@/lib/restaurant/rules";
import { RestIcon } from "./RestIcon";

const field =
  "w-full min-h-12 rounded-xl border border-[#e3e3e3] bg-white px-4 py-3 text-base text-[#1c1c1c] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#1c1c1c]";
const label = "mb-1.5 block text-[13px] font-semibold text-[#6b6b6b]";

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
}
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

function randomKey(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Ключ попытки — в sessionStorage: гость, у которого пропал ответ, может
 * перезагрузить страницу и отправить ту же заявку ещё раз, и она не
 * задвоится. Хранилище недоступно — ключ живёт до перезагрузки.
 */
const ATTEMPT_KEY = "cd_rest_table_attempt";
let memoryAttempt: { sig: string; key: string } | null = null;

function attemptFor(sig: string): string {
  let saved = memoryAttempt;
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    if (raw) saved = JSON.parse(raw) as { sig: string; key: string };
  } catch {
    // см. выше
  }
  if (saved && saved.sig === sig && typeof saved.key === "string") return saved.key;
  const next = { sig, key: randomKey() };
  memoryAttempt = next;
  try {
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(next));
  } catch {
    // см. выше
  }
  return next.key;
}

function forgetAttempt() {
  memoryAttempt = null;
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // см. выше
  }
}

/**
 * Заявка на стол. ТЗ, п. 5: после отправки — «заявка получена, бронь
 * действует после подтверждения», и ни одной строки, похожей на гарантию.
 * Число столов нигде не зашито: свободен ли стол, решает администратор.
 */
export function TableForm({
  locale,
  hours,
}: {
  locale: Locale;
  hours: { hoursOpen: string; hoursClose: string };
}) {
  const t = restaurantText(locale);
  const tt = t.tables;
  const now = useSyncExternalStore<number | null>(subscribeMinute, minuteNow, () => null);
  const [date, setDate] = useState("");
  // Слот целиком — «ГГГГ-ММ-ДД ЧЧ:ММ»: у ночных слотов дата следующего дня.
  const [pick, setPick] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const slots = useMemo(() => {
    if (!date || now === null) return [];
    return timeSlots(hours, date, { now });
  }, [date, now, hours]);
  const chosen = slots.find((s) => `${s.date} ${s.time}` === pick) ?? null;
  const maxDate = now === null ? undefined : addDaysISO(tashkentNow(now).date, TABLE_MAX_AHEAD_DAYS);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    const phone = normalizePhone(String(fd.get("phone") ?? ""));
    if (!chosen) return setError(t.errors.time.required);
    if (!phone) return setError(t.errors.phoneInvalid);
    fd.set("date", chosen.date);
    fd.set("time", chosen.time);
    fd.set("adults", String(adults));
    fd.set("kids", String(kids));
    // Тот же набор полей — тот же ключ: повтор после обрыва связи не создаст
    // вторую заявку.
    fd.set("idemKey", attemptFor(JSON.stringify([chosen.date, chosen.time, adults, kids, phone])));

    start(async () => {
      try {
        const res = await submitRestaurantTable(fd);
        if (res.ok) {
          if (!res.duplicate) trackEvent("restaurant_table_request_submitted", { guests: adults + kids });
          setSent(true);
          forgetAttempt();
          // Полный переход: ссылка статуса секретная, счётчики аналитики не
          // должны получить её как переход внутри сайта.
          if (res.token) window.location.assign(localizePath(locale, `/restaurant/order/${res.token}${res.duplicate ? "?again=1" : ""}`));
          return;
        }
        setError(res.error);
      } catch (err) {
        console.error("[restaurant] заявка на стол не ушла:", err);
        setError(tt.failed);
      }
    });
  };

  if (sent) {
    return (
      <div className="rounded-3xl bg-[#f6f5f2] px-6 py-14 text-center">
        <span className="rest-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22a45d] text-white">
          <RestIcon name="check" className="h-7 w-7" />
        </span>
        <p className="mt-5 text-2xl font-bold text-[#1c1c1c]">{t.status.table_labels.new.title}</p>
        <p className="mx-auto mt-2 max-w-md text-[#6b6b6b]">{tt.note}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ym-disable-keys rounded-3xl border border-[#ececec] p-5 sm:p-7">
      <input type="hidden" name="locale" value={locale} />
      <PageContextFields />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          name="dateView"
          label={tt.date}
          locale={locale}
          minToday
          maxDate={maxDate}
          value={date}
          onChange={(iso) => {
            setDate(iso);
            setPick("");
          }}
        />
        <label className="block">
          <span className={label}>{tt.time}</span>
          <select value={chosen ? pick : ""} onChange={(e) => setPick(e.target.value)} className={field} disabled={!date || slots.length === 0}>
            <option value="">—</option>
            {slots.map((s) => (
              <option key={`${s.date} ${s.time}`} value={`${s.date} ${s.time}`}>
                {s.nextDay ? `${s.time} · ${s.date.slice(8, 10)}.${s.date.slice(5, 7)}` : s.time}
              </option>
            ))}
          </select>
          {date && slots.length === 0 && <span className="mt-1.5 block text-xs font-semibold text-[#b42318]">{t.checkout.noSlots}</span>}
        </label>
        <label className="block">
          <span className={label}>{tt.adults}</span>
          <CountInput name="adultsView" min={1} max={40} value={adults} onValue={setAdults} className={field} />
        </label>
        <label className="block">
          <span className={label}>{tt.kids}</span>
          <CountInput name="kidsView" min={0} max={20} value={kids} onValue={setKids} className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.checkout.name}</span>
          <input name="name" required maxLength={120} placeholder={t.checkout.namePh} autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.checkout.phone}</span>
          <input name="phone" required type="tel" inputMode="tel" maxLength={40} placeholder="+998 90 123 45 67" autoComplete="tel" className={field} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className={label}>{tt.comment}</span>
        <textarea name="comment" rows={3} maxLength={1000} placeholder={tt.commentPh} className={`${field} resize-none`} />
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="privacyConsent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#f4a52a]" />
        <span className="text-sm leading-6 text-[#4a4a4a]">
          {t.checkout.consent.before}
          <a href={localizePath(locale, "/legal/privacy-policy")} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1c1c1c] underline underline-offset-2">
            {t.checkout.consent.link}
          </a>
          {t.checkout.consent.after}
        </span>
      </label>

      <p className="mt-5 rounded-2xl bg-[#f6f5f2] px-4 py-3 text-sm leading-6 text-[#4a4a4a]">{tt.note}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-press mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f4a52a] px-6 text-base font-bold text-[#3b2a0a] transition-colors hover:bg-[#eb9b1c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RestIcon name="table" className="h-5 w-5" />
        {pending ? tt.sending : tt.submit}
      </button>
    </form>
  );
}
