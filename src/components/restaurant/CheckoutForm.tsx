"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { submitRestaurantOrder } from "@/app/actions/restaurant";
import { trackEvent } from "@/lib/analytics";
import { money } from "@/lib/tariff";
import { DatePicker } from "@/components/ui/DatePicker";
import { CountInput } from "@/components/ui/CountInput";
import { PageContextFields } from "@/components/ui/PageContextFields";
import { attemptKey, clearCart, removeDishes, setCartMode, setQty, useCart } from "@/lib/restaurant/cart";
import type { Dish, OrderMode } from "@/lib/restaurant/model";
import {
  MAX_AHEAD_DAYS,
  MIN_LEAD_MIN,
  TABLE_MAX_AHEAD_DAYS,
  addDaysISO,
  dishProblem,
  modeFee,
  normalizePhone,
  pickText,
  timeSlots,
  withinHours,
  tashkentNow,
  type DishProblem,
} from "@/lib/restaurant/rules";
import { DishVisual } from "./DishVisual";
import { RestIcon, type RestIconName } from "./RestIcon";

const MODE_ICON: Record<OrderMode, RestIconName> = { takeaway: "takeaway", delivery: "delivery", room: "room", preorder: "table" };

export type CheckoutSettings = {
  hoursOpen: string;
  hoursClose: string;
  deliveryFee: number | null;
  roomFee: number | null;
  deliveryNote: string;
  preorderLeadHours: number;
};

const field =
  "w-full min-h-12 rounded-xl border border-[#e3e3e3] bg-white px-4 py-3 text-base text-[#1c1c1c] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#1c1c1c]";
const label = "mb-1.5 block text-[13px] font-semibold text-[#6b6b6b]";
const box = "rounded-3xl border border-[#ececec] p-5 sm:p-6";
const heading = "text-lg font-bold text-[#1c1c1c]";
const note = "rounded-2xl bg-[#f6f5f2] px-4 py-3 text-sm text-[#4a4a4a]";

const noop = () => () => {};

/**
 * «Сейчас» с точностью до минуты — внешним хранилищем, а не эффектом: список
 * времени зависит от часов, и на сервере его нет вовсе (null), поэтому
 * гидратации не о чем спорить.
 */
function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
}
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

/**
 * Оформление заказа.
 *
 * Сервер пересчитывает всё сам — здесь только то, что гость должен увидеть до
 * отправки: сумму, проблемные блюда и обязательные поля своего способа
 * получения (ТЗ, п. 4: поля разные для самовывоза, доставки и номера).
 *
 * Отправка идёт с ключом попытки: связь в горах рвётся, гость жмёт ещё раз —
 * и получает тот же заказ, а не второй.
 */
export function CheckoutForm({
  locale,
  dishes,
  openModes,
  settings,
  preview,
}: {
  locale: Locale;
  dishes: Dish[];
  openModes: OrderMode[];
  settings: CheckoutSettings;
  preview: boolean;
}) {
  const t = restaurantText(locale);
  const c = t.checkout;
  const router = useRouter();
  const cart = useCart();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const byId = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const currency = priceLabels.currencyShort[locale];

  const mode: OrderMode | null = cart.mode && openModes.includes(cart.mode) ? cart.mode : openModes.length === 1 ? openModes[0] : null;
  const [asap, setAsap] = useState(true);
  const [date, setDate] = useState("");
  // Выбранный слот целиком — «ГГГГ-ММ-ДД ЧЧ:ММ»: у ночных слотов дата уже
  // следующего дня, и хранить одно время без даты нельзя.
  const [pick, setPick] = useState("");
  const [unitType, setUnitType] = useState<"aframe" | "chalet">("aframe");
  // Поля адреса и домика — в состоянии: при смене способа получения они
  // исчезают из формы, и без этого введённое пропадало бы.
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState("");
  const [serverProblems, setServerProblems] = useState<{ dishId: number; problem: DishProblem }[]>([]);
  const [pending, start] = useTransition();
  // Заказ ушёл: корзина уже очищена, а переход на страницу статуса ещё идёт —
  // без этого флага на мгновение мелькала «Корзина пуста».
  const [sent, setSent] = useState(false);
  const now = useSyncExternalStore<number | null>(subscribeMinute, minuteNow, () => null);

  const lines = cart.lines;
  const priced = lines.map((l) => {
    const dish = byId.get(l.dishId);
    const problem = mode ? dishProblem(dish, mode) : dish ? null : ("missing" as const);
    return { ...l, dish, problem };
  });
  const problems = priced.filter((p) => p.problem || serverProblems.some((s) => s.dishId === p.dishId));
  const subtotal = priced.reduce((s, p) => s + (p.dish && !p.problem ? p.dish.price * p.qty : 0), 0);
  const fee = mode ? modeFee(settings, mode) : { fee: 0, pending: false };
  const total = subtotal + (fee.fee ?? 0);

  // Предзаказ — только ко времени; «как можно скорее» — только когда кухня
  // работает прямо сейчас.
  const kitchenOpenNow = now !== null && withinHours(settings, tashkentNow(now).minutes);
  const asapAllowed = mode !== "preorder" && kitchenOpenNow;
  const effectiveAsap = asap && asapAllowed;

  const slots = useMemo(() => {
    if (!date || now === null) return [];
    const leadMs = mode === "preorder" ? settings.preorderLeadHours * 3600_000 : MIN_LEAD_MIN * 60_000;
    return timeSlots(settings, date, { now, leadMs });
  }, [date, now, mode, settings]);
  // Слот, который за время заполнения формы прошёл, выбранным не считается —
  // иначе в список он не попадал, а на сервер уходил и получал «уже прошло».
  const chosen = slots.find((s) => `${s.date} ${s.time}` === pick) ?? null;
  const maxDate = now === null ? undefined : addDaysISO(tashkentNow(now).date, mode === "preorder" ? TABLE_MAX_AHEAD_DAYS : MAX_AHEAD_DAYS);

  if (!mounted) {
    return <div className="h-96 animate-pulse rounded-3xl bg-[#f6f5f2]" />;
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-[#f6f5f2] px-6 py-14 text-center">
        <span className="rest-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22a45d] text-white">
          <RestIcon name="check" className="h-7 w-7" />
        </span>
        <p className="mt-5 text-2xl font-bold text-[#1c1c1c]">{t.status.order_labels.new.title}</p>
        <p className="mt-2 text-[#6b6b6b]">{t.status.order_labels.new.text}</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-[#f6f5f2] px-6 py-14 text-center">
        <RestIcon name="bag" className="mx-auto h-11 w-11 text-[#cdc5b8]" />
        <p className="mt-4 text-2xl font-bold text-[#1c1c1c]">{c.empty}</p>
        <p className="mt-2 text-[#6b6b6b]">{c.emptyText}</p>
        <Link
          href={localizePath(locale, "/restaurant")}
          prefetch={false}
          className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#f4a52a] px-6 font-bold text-[#3b2a0a]"
        >
          {c.toMenu}
        </Link>
      </div>
    );
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!mode) return setError(t.errors.modeClosed);
    if (problems.length) return setError(c.problemsTitle);
    const phone = normalizePhone(String(fd.get("phone") ?? ""));
    if (!phone) return setError(t.errors.phoneInvalid);
    if (!effectiveAsap && !chosen) return setError(t.errors.time.required);

    fd.set("mode", mode);
    fd.set("locale", locale);
    fd.set("asap", effectiveAsap ? "1" : "");
    fd.set("date", effectiveAsap || !chosen ? "" : chosen.date);
    fd.set("time", effectiveAsap || !chosen ? "" : chosen.time);
    fd.set("cart", JSON.stringify(lines));
    // Сумма, которую гость видел: разойдётся с пересчётом на сервере — значит,
    // цену поменяли, пока форма была открыта, и гостю нужно её показать.
    fd.set("clientSubtotal", String(subtotal));
    if (mode === "room") fd.set("unitType", unitType);
    if (mode === "preorder") fd.set("guests", String(guests));
    // Тот же состав, способ, телефон и время — тот же ключ: повтор после
    // обрыва связи вернёт уже созданный заказ.
    fd.set("idemKey", attemptKey(JSON.stringify([lines, mode, phone, effectiveAsap || !chosen ? "asap" : `${chosen.date} ${chosen.time}`])));

    start(async () => {
      try {
        const res = await submitRestaurantOrder(fd);
        if (res.ok) {
          if (!res.duplicate) trackEvent("restaurant_order_submitted", { mode, total });
          setSent(true);
          clearCart();
          // Полный переход, а не router.replace: адрес статуса — секретная
          // ссылка, и счётчики аналитики не должны получить её как переход
          // внутри сайта (на самой странице статуса они не запускаются).
          if (res.token) window.location.assign(localizePath(locale, `/restaurant/order/${res.token}${res.duplicate ? "?again=1" : ""}`));
          return;
        }
        setError(res.error);
        setServerProblems(res.problems ?? []);
        if (res.priceChanged) router.refresh();
      } catch (err) {
        console.error("[restaurant] отправка не удалась:", err);
        setError(c.failed);
      }
    });
  };

  // Отправка, оговорка и ошибка — одним блоком: на компьютере он в колонке
  // заказа, рядом с суммой; на телефоне — в конце формы, после контактов.
  const submitBlock = (
    <>
      {preview && <p className="mb-3 rounded-2xl bg-[#e7f5f6] px-4 py-3 text-sm text-[#0e5f67]">{c.testNote}</p>}
      {error && (
        <p role="alert" className="mb-3 rounded-2xl bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !mode}
        className="btn-press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f4a52a] px-6 text-base font-bold text-[#3b2a0a] transition-colors hover:bg-[#eb9b1c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? c.sending : c.submit}
        {!pending && <span className="tabular-nums">· {money(total)} {currency}</span>}
      </button>
      <p className="mt-3 text-xs leading-5 text-[#8c8c8c]">{c.notice}</p>
    </>
  );

  return (
    <form onSubmit={submit} className="ym-disable-keys grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8">
      <input type="hidden" name="locale" value={locale} />
      <PageContextFields />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Состав заказа — на телефоне первым: гость должен видеть, что заказывает. */}
      <aside className="rest-side order-first rounded-3xl bg-[#f6f5f2] p-5 lg:sticky lg:order-last">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-[#1c1c1c]">{c.cart}</p>
          <Link href={localizePath(locale, "/restaurant")} prefetch={false} className="text-sm font-semibold text-[#6b6b6b] hover:text-[#1c1c1c]">
            + {t.menu.title}
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {priced.map((p) => {
            const title = p.dish ? pickText(p.dish.title, locale) : `#${p.dishId}`;
            const bad = p.problem ?? serverProblems.find((s) => s.dishId === p.dishId)?.problem ?? null;
            return (
              <li key={p.dishId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <DishVisual image={p.dish?.image ?? ""} title={title} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-5 text-[#1c1c1c]">{title}</p>
                  {bad ? (
                    <p className="text-xs font-semibold text-[#b42318]">{t.errors.problem[bad]}</p>
                  ) : (
                    <p className="text-[13px] font-semibold tabular-nums text-[#1c1c1c]">
                      {p.dish ? `${money(p.dish.price * p.qty)} ${currency}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center rounded-xl bg-white">
                  <button
                    type="button"
                    onClick={() => setQty(p.dishId, p.qty - 1)}
                    className="btn-press flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/5"
                    aria-label="−"
                  >
                    <RestIcon name="minus" className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-semibold tabular-nums">{p.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(p.dishId, p.qty + 1)}
                    disabled={Boolean(bad)}
                    className="btn-press flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/5 disabled:opacity-30"
                    aria-label="+"
                  >
                    <RestIcon name="plus" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {problems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              removeDishes(problems.map((p) => p.dishId));
              setServerProblems([]);
              setError("");
            }}
            className="btn-press mt-3 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#b42318]"
          >
            {c.removeAll}
          </button>
        )}

        <div className="mt-4 space-y-1.5 border-t border-[#e6e3dd] pt-4 text-sm">
          <div className="flex justify-between text-[#6b6b6b]">
            <span>{c.dishes}</span>
            <span className="tabular-nums">
              {money(subtotal)} {currency}
            </span>
          </div>
          {(mode === "delivery" || mode === "room") && (
            <div className="flex justify-between text-[#6b6b6b]">
              <span>{c.fee[mode]}</span>
              <span className="tabular-nums">{fee.pending ? c.feePending : fee.fee ? `${money(fee.fee)} ${currency}` : c.free}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1 text-[#1c1c1c]">
            <span className="font-semibold">{c.total}</span>
            <span className="text-xl font-bold tabular-nums">
              {money(total)} {currency}
            </span>
          </div>
          {fee.pending && <p className="text-right text-xs text-[#8c8c8c]">{c.totalPending}</p>}
        </div>

        <div className="mt-5 hidden lg:block">{submitBlock}</div>
      </aside>

      <div className="space-y-4">
        {/* Способ получения */}
        <fieldset className={box}>
          <legend className="sr-only">{c.how}</legend>
          <p className={heading}>{c.how}</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {openModes.map((m) => {
              const on = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCartMode(m);
                    setServerProblems([]);
                    setError("");
                  }}
                  aria-pressed={on}
                  className={`btn-press flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    on ? "border-[#1c1c1c] ring-1 ring-[#1c1c1c]" : "border-[#e3e3e3] hover:border-[#bdbdbd]"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-[#f4a52a] text-[#3b2a0a]" : "bg-[#f6f5f2] text-[#1c1c1c]"}`}>
                    <RestIcon name={MODE_ICON[m]} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#1c1c1c]">{t.modes[m].title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#8c8c8c]">{t.modes[m].hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {mode === "delivery" && (
            <div className="mt-5 grid gap-4">
              {settings.deliveryNote && <p className={note}>{settings.deliveryNote}</p>}
              <label className="block">
                <span className={label}>{c.locality}</span>
                <input name="locality" required maxLength={160} value={locality} onChange={(e) => setLocality(e.target.value)} placeholder={c.localityPh} className={field} />
              </label>
              <label className="block">
                <span className={label}>{c.address}</span>
                <input name="address" required maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={c.addressPh} autoComplete="street-address" className={field} />
              </label>
            </div>
          )}

          {mode === "room" && (
            <div className="mt-5 grid gap-4">
              <p className={note}>{c.breakfastNote}</p>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div>
                  <span className={label}>{c.unitType}</span>
                  <div className="inline-flex rounded-xl bg-[#f6f5f2] p-1">
                    {(["aframe", "chalet"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnitType(u)}
                        aria-pressed={unitType === u}
                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${unitType === u ? "bg-white text-[#1c1c1c] shadow-sm" : "text-[#6b6b6b]"}`}
                      >
                        {u === "aframe" ? "A-frame" : "Chalet"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className={label}>{c.unitNo}</span>
                  <input name="unitNo" required maxLength={12} inputMode="numeric" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder={c.unitNoPh} className={field} />
                </label>
              </div>
            </div>
          )}

          {mode === "preorder" && (
            <label className="mt-5 block max-w-xs">
              <span className={label}>{c.guests}</span>
              <CountInput name="guestsView" min={1} max={40} value={guests} onValue={setGuests} className={field} />
            </label>
          )}
        </fieldset>

        {/* Когда */}
        <fieldset className={box}>
          <legend className="sr-only">{c.when}</legend>
          <p className={heading}>{c.when}</p>
          <div className="mt-4 inline-flex rounded-xl bg-[#f6f5f2] p-1">
            {asapAllowed && (
              <button
                type="button"
                onClick={() => setAsap(true)}
                aria-pressed={effectiveAsap}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${effectiveAsap ? "bg-white text-[#1c1c1c] shadow-sm" : "text-[#6b6b6b]"}`}
              >
                {c.asap}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAsap(false)}
              aria-pressed={!effectiveAsap}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${!effectiveAsap ? "bg-white text-[#1c1c1c] shadow-sm" : "text-[#6b6b6b]"}`}
            >
              {c.scheduled}
            </button>
          </div>

          {!effectiveAsap && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DatePicker
                name="dateView"
                label={c.date}
                locale={locale}
                minToday
                maxDate={maxDate}
                value={date}
                onChange={(iso) => {
                  setDate(iso);
                  setPick("");
                  // Выбор даты — это выбор «ко времени»: иначе заказ мог
                  // тихо уйти «как можно скорее», когда кухня открылась.
                  setAsap(false);
                }}
              />
              <label className="block">
                <span className={label}>{c.time}</span>
                <select
                  value={chosen ? pick : ""}
                  onChange={(e) => {
                    setPick(e.target.value);
                    setAsap(false);
                  }}
                  className={field}
                  disabled={!date || slots.length === 0}
                >
                  <option value="">—</option>
                  {slots.map((s) => (
                    <option key={`${s.date} ${s.time}`} value={`${s.date} ${s.time}`}>
                      {s.nextDay ? `${s.time} · ${s.date.slice(8, 10)}.${s.date.slice(5, 7)}` : s.time}
                    </option>
                  ))}
                </select>
                {date && slots.length === 0 && <span className="mt-1.5 block text-xs font-semibold text-[#b42318]">{c.noSlots}</span>}
              </label>
            </div>
          )}
        </fieldset>

        {/* Контакты */}
        <fieldset className={box}>
          <legend className="sr-only">{c.contacts}</legend>
          <p className={heading}>{c.contacts}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{mode === "room" ? c.fullName : c.name}</span>
              <input name="name" required maxLength={120} placeholder={c.namePh} autoComplete="name" className={field} />
            </label>
            <label className="block">
              <span className={label}>{c.phone}</span>
              <input name="phone" required type="tel" inputMode="tel" maxLength={40} placeholder="+998 90 123 45 67" autoComplete="tel" className={field} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={label}>{c.comment}</span>
            <textarea name="comment" rows={3} maxLength={1000} placeholder={c.commentPh} className={`${field} resize-none`} />
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="privacyConsent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#f4a52a]" />
            <span className="text-sm leading-6 text-[#4a4a4a]">
              {c.consent.before}
              <a href={localizePath(locale, "/legal/privacy-policy")} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1c1c1c] underline underline-offset-2">
                {c.consent.link}
              </a>
              {c.consent.after}
            </span>
          </label>
        </fieldset>

        <div className="lg:hidden">{submitBlock}</div>
      </div>
    </form>
  );
}
