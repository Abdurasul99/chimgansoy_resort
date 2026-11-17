import { promotions, type Promotion } from "@/content/promotions";
import { discountMath, promoBookable, promoBreakdown, todayTashkent, type DiscountMath } from "@/lib/promo-nights";
import { PromoSticker, StickerConfetti } from "./PromoSticker";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text, list } from "@/lib/localize";
import { money } from "@/lib/tariff";
import { priceLabels } from "@/content/pricing";

type Props = { locale: Locale };

const TERMS_LABEL: Record<Locale, string> = { ru: "Условия акции", uz: "Aksiya shartlari", en: "Offer terms" };
/** Подпись под полоской дней у акции «День рождения» — пересказ условия владельца. */
const BDAY_WINDOW: Record<Locale, string> = {
  ru: "3 дня до · ваш день · 3 дня после",
  uz: "3 kun oldin · sizning kuningiz · 3 kun keyin",
  en: "3 days before · your day · 3 days after",
};
const BOOK_LABEL: Record<Locale, string> = { ru: "Забронировать", uz: "Bron qilish", en: "Book now" };

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
    saving: "Tejaysiz",
    savingPer: "so'm har bir kecha uchun",
    breakfast: "Nonushta yashash narxiga kiritilgan.",
    four: "To'rt kishi bo'lsangiz",
    lead: (n: number) => `${n} mehmon joylashganda:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = kishi boshiga kechasiga ${pp} so'm`,
    total: (pp: string) => `Atigi ${pp} so'm / kishi / kecha`,
    totalNote: (n: number) => `Shaleda ${n} mehmon bo'lganda.`,
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
 * Каждая акция — купон во всю ширину со своим стикером (см. card ниже).
 * Вес у предложений разный, но держит его содержимое — расчёт выгоды, — а не
 * ширина: узкая карточка рядом с широкой оставляла пустые полосы.
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
    ru: { how: "Как считается", one: "3 ночи без акции", three: "3 ночи по акции", per: "За ночь", note: "Суммы в сумах, ночи с воскресенья по четверг. Завтрак включён, обед и ужин — по меню ресторана, отдельно." },
    uz: { how: "Qanday hisoblanadi", one: "3 kecha aksiyasiz", three: "3 kecha aksiya bo'yicha", per: "Bir kecha uchun", note: "Narxlar so'mda, yakshanbadan payshanbagacha bo'lgan kechalar. Nonushta narxga kiradi, tushlik va kechki ovqat — restoran menyusi bo'yicha, alohida." },
    en: { how: "How it adds up", one: "3 nights, no offer", three: "3 nights, offer", per: "Per night", note: "UZS, Sunday–Thursday nights. Breakfast included; lunch and dinner are from the restaurant menu, extra." },
  }[locale];

  const href = (slug: string) =>
    `${localizePath(locale, "/bron")}?utm_source=site&utm_medium=offers&utm_content=${slug}`;

  if (!active.length) return null;

  /**
   * Карточка акции — «подарочный сертификат».
   *
   * Слева — суть и расчёт, справа на компьютере — корешок купона: стикер с
   * главной цифрой и условия. До 12.11.2026 карточки были разной ширины, и у
   * широких правая половина стояла пустой, а узкая (день рождения) висела одна
   * в последнем ряду. Теперь каждая акция — строка во всю ширину.
   *
   * На телефоне и планшете стикер — наклейка в правом верхнем углу (заголовок
   * отодвинут от неё отступом), условия — свёрнуты на телефоне и списком на
   * планшете.
   */
  const card = (promo: Promotion, lead: boolean) => {
    const rows = promo.slug === "2plus1" ? promoBreakdown() : [];
    const discount = promo.discount ? discountMath(promo.discount) : null;
    const terms = list(promo.terms, locale);
    const sticker = promo.sticker;
    // День рождения — праздничная карточка: розовый фон, конфетти, полоска дней.
    const bday = promo.slug === "birthday";
    const rose = sticker?.tone === "rose";
    // Цифра уже на стикере — в бейдже её не повторяем: «−20% · Ноябрь» → «Ноябрь».
    const badgeFull = text(promo.badge, locale);
    const badge =
      sticker && badgeFull.startsWith(sticker.label) ? badgeFull.slice(sticker.label.length).replace(/^\s*·\s*/, "") : badgeFull;
    return (
      /*
       * Карточка — article со «растянутой» ссылкой (кнопка внизу, after:inset-0),
       * а не одна большая <a>: внутри неё на телефоне раскрываются условия, а
       * раскрывашка внутри ссылки — недопустимая вложенность, и нажатие на неё
       * уводило бы в бронь. Вся карточка по-прежнему нажимается целиком.
       */
      <article
        key={promo.slug}
        className={`group relative flex flex-col overflow-hidden rounded-3xl border p-5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_380px] ${
          rose
            ? "border-[#ffc9b8] bg-[linear-gradient(140deg,#fff4ec_0%,#ffe9e4_55%,#fff6dc_100%)]"
            : "border-[color:var(--line)] bg-[var(--paper)]"
        }`}
      >
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--sun)] to-transparent" />

        <div className="flex min-w-0 flex-col">
          {/*
              Стикер до компьютера — float справа: бейдж и первые строки
              заголовка обтекают его, дальше текст идёт во всю ширину. С
              отступом под стикер на 320 px заголовок «2+1» ломался в три
              узкие строки. На компьютере стикер — в корешке справа (второй
              экземпляр, свой uid: у скрытого SVG градиент не рисуется).
          */}
          <div className="flow-root">
          {sticker ? (
            <div
              aria-hidden="true"
              className="pointer-events-none relative float-right -mr-1.5 -mt-1.5 mb-1 ml-3 h-[84px] w-[84px] rotate-[10deg] sm:-mr-1 sm:-mt-1 sm:h-[104px] sm:w-[104px] lg:hidden"
            >
              {rose ? <StickerConfetti side="right" className="absolute -inset-[30%]" /> : null}
              <PromoSticker sticker={sticker} uid={`${promo.slug}-m`} className="relative h-full w-full" />
            </div>
          ) : null}
          {badge ? (
            <span
              className={`relative inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                rose ? "bg-[#ff4d6d] text-white" : lead || discount ? "bg-[var(--sun)] text-[var(--ink)]" : "bg-[var(--ink)] text-white"
              }`}
            >
              {badge}
            </span>
          ) : null}
          <h3 className="relative mt-4 font-serif text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            {text(promo.title, locale)}
          </h3>
          <p className={`relative mt-3 max-w-xl text-[15px] leading-7 ${rose ? "text-[var(--ink)]/75" : "text-[var(--muted)]"}`}>
            {text(promo.description, locale)}
          </p>
          </div>

          {bday ? <BirthdayWindow locale={locale} /> : null}

          {/* «Как это работает» по шагам — у акции, где оно задано (поле howItWorks). */}
          {promo.howItWorks ? (
            <div className="mt-4 max-w-xl rounded-2xl bg-[var(--surface-warm)] px-4 py-3">
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

          {/* Условия до компьютера: на телефоне свёрнуты (девять строк мелкого
              текста растягивали карточку «2+1» на экран), на планшете — списком.
              На компьютере они в корешке купона справа. */}
          <ul className="relative mt-auto hidden pt-5 text-[12.5px] leading-6 text-[var(--muted)] sm:block lg:hidden">
            {terms.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <details className="group/terms relative z-10 mt-auto pt-4 sm:hidden">
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold text-[var(--ink)] [&::-webkit-details-marker]:hidden ${
                rose ? "bg-white/70" : "bg-[var(--surface-warm)]"
              }`}
            >
              {TERMS_LABEL[locale]}
              <span aria-hidden className="text-lg leading-none transition-transform group-open/terms:rotate-45">+</span>
            </summary>
            <ul className="mt-2 space-y-1 px-1 text-[13px] leading-5 text-[var(--muted)]">
              {terms.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </details>

          <span aria-hidden className="hidden lg:block lg:h-6" />
          <a
            href={href(promo.slug)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-[var(--sun)] px-5 text-sm font-bold text-[var(--ink)] shadow-[0_8px_18px_-10px_rgba(217,138,20,0.9)] transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:bg-[#f7b346] sm:mt-5 lg:mt-auto"
          >
            {BOOK_LABEL[locale]}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/*
            Корешок купона — только на компьютере: колонка справа, пунктирная
            рамка, стикер крупно и условия. До компьютера корешок пуст и
            скрыт: стикер — в шапке карточки, условия — под расчётом.
        */}
        <aside
          className={`hidden lg:flex lg:flex-col lg:items-center lg:rounded-2xl lg:border lg:border-dashed lg:px-6 lg:pb-6 lg:pt-7 ${
            rose ? "lg:border-[#ffb3a3] lg:bg-white/55" : "lg:border-[#efc679] lg:bg-[#fff7e6]"
          }`}
        >
          {sticker ? (
            <div
              aria-hidden="true"
              className="pointer-events-none relative hidden h-[132px] w-[132px] shrink-0 rotate-[10deg] transition-transform duration-300 group-hover:rotate-[4deg] group-hover:scale-105 lg:block"
            >
              {rose ? <StickerConfetti side="top" className="absolute -inset-[30%]" /> : null}
              <PromoSticker sticker={sticker} uid={`${promo.slug}-d`} className="relative h-full w-full" />
            </div>
          ) : null}
          <div className={`hidden w-full lg:block ${rose ? "lg:mt-9" : "lg:mt-6"}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{TERMS_LABEL[locale]}</p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-[1.45] text-[var(--muted)]">
              {terms.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className={rose ? "text-[#ff4d6d]" : "text-[var(--sun-dark)]"}>
                    ·
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </article>
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

        <div className="mt-8 grid gap-5">{active.map((p, i) => card(p, i === 0))}</div>
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

/**
 * Окно скидки на день рождения картинкой: семь дней, в центре — торт.
 * Полоска декоративная (aria-hidden); то же самое словами — в подписи под ней
 * и в описании акции.
 */
function BirthdayWindow({ locale }: { locale: Locale }) {
  return (
    <div className="relative mt-5 w-full max-w-sm">
      <ol aria-hidden="true" className="grid grid-cols-7 gap-1.5">
        {[-3, -2, -1, 0, 1, 2, 3].map((d) =>
          d === 0 ? (
            <li
              key={d}
              className="flex h-10 items-center justify-center rounded-xl bg-[#ff4d6d] text-white shadow-[0_8px_16px_-8px_rgba(255,77,109,0.8)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5c1.1 1.3 1.1 2.6 0 3.3-1.1-.7-1.1-2 0-3.3z" fill="currentColor" />
                <path d="M12 7.5v2.5" />
                <rect x="4" y="10" width="16" height="10" rx="2.5" />
                <path d="M4 14.5c1.4 1 2.7 1 4 0s2.6-1 4 0 2.6 1 4 0 2.6-1 4 0" />
              </svg>
            </li>
          ) : (
            <li
              key={d}
              className="flex h-10 items-center justify-center rounded-xl bg-white/80 text-[13px] font-bold tabular-nums text-[var(--ink)]/75 ring-1 ring-[#ffc9b8]"
            >
              {d < 0 ? `−${-d}` : `+${d}`}
            </li>
          ),
        )}
      </ol>
      <p className="mt-2 text-center text-[12px] font-medium text-[var(--ink)]/60">{BDAY_WINDOW[locale]}</p>
    </div>
  );
}
