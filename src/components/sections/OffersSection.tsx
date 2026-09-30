import { promotions, type Promotion } from "@/content/promotions";
import { discountMath, promoBookable, promoBreakdown, todayTashkent, type DiscountMath } from "@/lib/promo-nights";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text, list } from "@/lib/localize";
import { money } from "@/lib/tariff";
import { priceLabels } from "@/content/pricing";

type Props = { locale: Locale };

/** Подписи расчёта скидки («−20% на Chalet»): формулировки оператора. */
const DISCOUNT_COPY = {
  ru: {
    how: "Как считается",
    night: "/ ночь",
    discount: "Скидка",
    saving: "Экономия",
    savingPer: "сум за каждую ночь",
    breakfast: "Завтрак включён в стоимость проживания.",
    four: "Если вас четверо",
    lead: (n: number) => `При размещении ${n} гостей:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = ${pp} сум с человека за ночь`,
    total: (pp: string) => `Всего ${pp} сум / человек / ночь`,
    totalNote: (n: number) => `при размещении ${n} гостей в Chalet.`,
  },
  uz: {
    how: "Qanday hisoblanadi",
    night: "/ kecha",
    discount: "Chegirma",
    saving: "Tejash",
    savingPer: "so'm har bir kecha uchun",
    breakfast: "Nonushta yashash narxiga kiritilgan.",
    four: "Agar siz to'rt kishi bo'lsangiz",
    lead: (n: number) => `${n} mehmon joylashganda:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = kishi boshiga kechasiga ${pp} so'm`,
    total: (pp: string) => `Jami ${pp} so'm / kishi / kecha`,
    totalNote: (n: number) => `Chalet'da ${n} mehmon joylashganda.`,
  },
  en: {
    how: "How it adds up",
    night: "/ night",
    discount: "Discount",
    saving: "You save",
    savingPer: "UZS every night",
    breakfast: "Breakfast is included in the rate.",
    four: "If there are four of you",
    lead: (n: number) => `With ${n} guests:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = ${pp} UZS per person per night`,
    total: (pp: string) => `Just ${pp} UZS / person / night`,
    totalNote: (n: number) => `with ${n} guests in the Chalet.`,
  },
} as const;

/**
 * Действующие акции.
 *
 * Стоят выше отзывов и галереи: акция отвечает на вопрос «почему сейчас», а
 * фотографии — на «как там». Гость, пришедший из сторис, должен увидеть повод
 * раньше, чем начнёт листать.
 *
 * Карточки разной величины намеренно: у акции с расчётом («2+1», «−20% на
 * Chalet») есть цифры выгоды, и она занимает всю ширину. Одинаковые плитки
 * читались бы как список условий, а это предложения с разным весом.
 *
 * Ссылка каждой карточки несёт slug акции в utm_content — в заявке будет
 * видно, что именно сработало. Те же метки стоят на визитке из шапки
 * Instagram, поэтому статистика по акции собирается с обоих входов сразу.
 */
export function OffersSection({ locale }: Props) {
  const dict = dictionaries[locale];
  /*
   * Просроченная акция уходит со страницы сама. Дата — по Ташкенту: сайт
   * живёт там, а не там, где сервер.
   *
   * У «2+1» мерилом служит последний заезд, а не дата срока: при сроке три
   * ночи с заезда за день до него уже за сроком, и карточка звала бы на даты,
   * которых нет. Остальные акции живут до своей даты.
   */
  const today = todayTashkent();
  const active = promotions.filter(
    (p) =>
      (p.slug === "2plus1" ? promoBookable(today) : !p.until || today <= p.until) &&
      !p.hiddenOnSite,
  );
  const cols = {
    ru: { how: "Как считается", one: "3 ночи без акции", three: "3 ночи по акции", per: "За ночь", note: "Суммы в сумах, ночи с воскресенья по четверг. Завтрак включён, обед и ужин («Всё включено») — отдельно." },
    uz: { how: "Qanday hisoblanadi", one: "3 kecha aksiyasiz", three: "3 kecha aksiyada", per: "Kechasi", note: "Summalar so'mda, yakshanbadan payshanbagacha bo'lgan kechalar. Nonushta kiritilgan, tushlik va kechki ovqat («Hammasi kiritilgan») — alohida." },
    en: { how: "How it adds up", one: "3 nights, no offer", three: "3 nights, offer", per: "Per night", note: "UZS, Sunday–Thursday nights. Breakfast included; lunch and dinner (All-Inclusive) are extra." },
  }[locale];

  const href = (slug: string) =>
    `${localizePath(locale, "/bron")}?utm_source=site&utm_medium=offers&utm_content=${slug}`;

  if (!active.length) return null;

  /** Карточка акции. Первая — ведущая, с золотым бейджем. */
  const card = (promo: Promotion, lead: boolean) => {
    const rows = promo.slug === "2plus1" ? promoBreakdown() : [];
    const discount = promo.discount ? discountMath(promo.discount) : null;
    // Во всю ширину — ведущая и любая с расчётом: таблице в полколонки тесно.
    const wide = lead || rows.length > 0 || discount !== null;
    return (
      <a
        key={promo.slug}
        href={href(promo.slug)}
        className={`group relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-7 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] ${wide ? "sm:col-span-2" : ""}`}
      >
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--sun)] to-transparent" />
        <span
          className={`self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            lead || discount ? "bg-[var(--sun)] text-[var(--ink)]" : "bg-[var(--ink)] text-white"
          }`}
        >
          {text(promo.badge, locale)}
        </span>
        <h3 className={`mt-4 font-serif font-semibold text-[var(--ink)] ${wide ? "text-2xl sm:text-3xl" : "text-xl"}`}>
          {text(promo.title, locale)}
        </h3>
        <p className={`mt-3 text-[var(--muted)] ${wide ? "max-w-xl text-[15px] leading-7" : "text-[14.5px] leading-6"}`}>
          {text(promo.description, locale)}
        </p>

        {/* Расписание питания — у «Всё включено» и тогда, когда она ведущая. */}
        {promo.howItWorks ? (
          <div className={`mt-4 rounded-2xl bg-[var(--surface-warm)] px-4 py-3 ${wide ? "max-w-xl" : ""}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              {text(promo.howItWorks.title, locale)}
            </p>
            <ul className="mt-1.5 space-y-1 text-[13.5px] leading-5 text-[var(--ink)]">
              {list(promo.howItWorks.lines, locale).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/*
            Расчёт «2+1» — так, как его объясняет гостям оператор: сколько
            стоит ночь, сколько три ночи по акции и во что это выходит за
            ночь. Цифры считаются из тарифа в promotions.ts, в тексте их нет.
        */}
        {rows.length ? (
          <div className="mt-5 overflow-x-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{cols.how}</p>
            {/* На телефоне таблица в четыре колонки не помещалась: min-w в
                352 px против ~290 внутри карточки, и колонка «за ночь» —
                главная цифра акции — уезжала за край под прокрутку. До sm
                колонок три: цена без акции встаёт зачёркнутой над ценой по
                акции. */}
            <table className="mt-2 w-full max-w-xl text-left text-sm sm:min-w-[22rem]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-1.5 font-semibold" />
                  <th className="hidden py-1.5 text-right font-semibold sm:table-cell">{cols.one}</th>
                  <th className="py-1.5 text-right font-semibold">{cols.three}</th>
                  <th className="py-1.5 text-right font-semibold">{cols.per}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label.ru} className="border-t border-dashed border-[color:var(--line)]">
                    <td className="py-2 text-[var(--ink)]">{text(r.label, locale)}</td>
                    <td className="hidden py-2 text-right tabular-nums text-[var(--muted)] line-through decoration-[var(--muted)]/50 sm:table-cell">
                      {money(r.night * 3)}
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums text-[var(--ink)]">
                      <span className="block text-[11px] font-normal text-[var(--muted)] line-through decoration-[var(--muted)]/50 sm:hidden">
                        {money(r.night * 3)}
                      </span>
                      {money(r.total)}
                    </td>
                    <td className="py-2 pl-2 text-right text-base font-bold tabular-nums text-[var(--accent)] sm:text-lg">
                      {money(r.perNight)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[11px] text-[var(--muted)]">{cols.note}</p>
          </div>
        ) : null}

        {discount && promo.discount ? (
          <DiscountCalc d={discount} label={text(promo.discount.label, locale)} locale={locale} />
        ) : null}

        <ul className="mt-auto pt-5 text-[12.5px] leading-6 text-[var(--muted)]">
          {list(promo.terms, locale).map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </a>
    );
  };

  return (
    <section className="bg-[var(--surface-warm)] px-4 py-16 sm:px-6 lg:px-8" id="offers">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          {dict.home.offersEyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
          {dict.home.offersTitle}
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">{active.map((p, i) => card(p, i === 0))}</div>
      </div>
    </section>
  );
}

/**
 * «Было → стало» по скидке и цена с человека — словами оператора: «3 000 000 →
 * 2 400 000 / ночь, скидка 20%, экономия 600 000; если вас четверо — 600 000
 * с человека». Все числа — из discountMath.
 */
function DiscountCalc({ d, label, locale }: { d: DiscountMath; label: string; locale: Locale }) {
  const c = DISCOUNT_COPY[locale];
  const cur = priceLabels.currencyShort[locale];
  return (
    <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-[var(--surface-warm)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{c.how}</p>
        <p className="mt-2 text-[13px] text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <s className="text-[var(--muted)] decoration-[var(--muted)]/60">{money(d.base)}</s>
          <span aria-hidden="true" className="text-[var(--sun-dark)]">→</span>
          <b className="text-xl font-bold text-[var(--accent)]">{money(d.price)}</b>
          <span className="text-[13px] text-[var(--muted)]">
            {cur} {c.night}
          </span>
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
          <dt className="text-[var(--muted)]">{c.discount}</dt>
          <dd className="font-semibold text-[var(--ink)]">−{d.percent}%</dd>
          <dt className="text-[var(--muted)]">{c.saving}</dt>
          <dd className="font-semibold tabular-nums text-[var(--ink)]">
            {money(d.saving)} {c.savingPer}
          </dd>
        </dl>
        <p className="mt-2 text-[12.5px] text-[var(--muted)]">{c.breakfast}</p>
      </div>
      <div className="rounded-2xl border border-[var(--sun)]/40 bg-[var(--sun)]/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sun-dark)]">{c.four}</p>
        <p className="mt-2 text-[13.5px] text-[var(--ink)]">{c.lead(d.guests)}</p>
        <p className="mt-0.5 text-[13.5px] tabular-nums text-[var(--ink)]">{c.line(money(d.price), d.guests, money(d.perPerson))}</p>
        {/* Не font-serif: у Cormorant цифры «старинные», и «600 000» читалось как «6оо ооо». */}
        <p className="mt-2 text-xl font-bold tabular-nums text-[var(--ink)]">{c.total(money(d.perPerson))}</p>
        <p className="text-[12.5px] text-[var(--muted)]">{c.totalNote(d.guests)}</p>
      </div>
    </div>
  );
}
