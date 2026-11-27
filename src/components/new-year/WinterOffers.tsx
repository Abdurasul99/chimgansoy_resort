import type { Promotion } from "@/content/promotions";
import {
  BDAY_WINDOW,
  DISCOUNT_COPY,
  ENGINE_LABEL,
  ONE_CLICK,
  TERMS_LABEL,
  TWO_PLUS_ONE_COLS,
  badgeWithoutSticker,
} from "@/content/offers-copy";
import { priceLabels } from "@/content/pricing";
import type { Locale } from "@/i18n/config";
import { list, text } from "@/lib/localize";
import { activePromotions, discountMath, promoBreakdown, type DiscountMath } from "@/lib/promo-nights";
import { promoLinks } from "@/lib/promo-links";
import { money } from "@/lib/tariff";
import { PromoSticker, StickerConfetti } from "@/components/sections/PromoSticker";
import { Snowflake } from "./Snowflake";

/**
 * Акции на зимнем экране (владелец, 27.11.2026: «перенеси все акции туда
 * тоже, в зимнюю тему»).
 *
 * Не копия текста, а те же записи из content/promotions.ts по тем же
 * правилам, что блок акций на главной: activePromotions (сроки по Ташкенту),
 * расчёт выгоды из тарифа, две кнопки с меткой акции (utm_medium=winter —
 * в заявке видно, что гость пришёл с зимнего экрана). Сняли или поменяли
 * акцию — меняется в обоих местах.
 *
 * Своя разметка, а не тема для OffersSection: экран ночной, и купон здесь —
 * матовое стекло с золотом и инеем; блок на главной остаётся каким был.
 */
export function WinterOffers({ locale, title, lead }: { locale: Locale; title: string; lead: string }) {
  const active = activePromotions();
  if (!active.length) return null;
  return (
    <section aria-labelledby="ny-offers-title" id="aksii" className="relative bg-[#0b1424] text-[#eef3fa]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-2 sm:px-6 lg:px-8">
        <h2 id="ny-offers-title" className="m-0 font-serif text-[clamp(2.2rem,6vw,3.4rem)] font-bold italic leading-none">
          {title}
        </h2>
        <p className="mb-0 mt-4 max-w-xl text-[1rem] leading-relaxed text-[#a6b6cb]">{lead}</p>
        <div className="mt-8 grid gap-5">
          {active.map((p) => (
            <WinterCoupon key={p.slug} promo={p} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WinterCoupon({ promo, locale }: { promo: Promotion; locale: Locale }) {
  const rows = promo.slug === "2plus1" ? promoBreakdown() : [];
  const discount = promo.discount ? discountMath(promo.discount) : null;
  const terms = list(promo.terms, locale);
  const sticker = promo.sticker;
  const rose = sticker?.tone === "rose";
  const badge = badgeWithoutSticker(text(promo.badge, locale), sticker?.label);
  const links = promoLinks(promo, locale, "winter");
  const cols = TWO_PLUS_ONE_COLS[locale];

  return (
    /*
     * article со «растянутой» ссылкой первой кнопки (after:inset-0), как на
     * главной: вся карточка нажимается, а раскрывашка условий на телефоне не
     * оказывается внутри ссылки.
     */
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] p-5 shadow-[0_30px_60px_-36px_rgba(0,0,0,0.9)] ring-1 sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_360px] ${
        rose
          ? "bg-[linear-gradient(155deg,#2b1a33_0%,#1b1832_55%,#111a2e_100%)] ring-[#ff8fa3]/30"
          : "bg-[linear-gradient(155deg,#17283f_0%,#101d33_55%,#0d1729_100%)] ring-white/12"
      }`}
    >
      {/* Иней по верхнему краю и пара снежинок в углу — декор. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd27a]/70 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rotate-12 text-white/[0.06]">
        <Snowflake className="h-full w-full" />
      </span>
      <span aria-hidden className="pointer-events-none absolute bottom-6 left-[46%] hidden h-10 w-10 -rotate-12 text-white/[0.05] lg:block">
        <Snowflake className="h-full w-full" />
      </span>

      <div className="relative flex min-w-0 flex-col">
        <div className="flow-root">
          {sticker ? (
            <div
              aria-hidden="true"
              className="pointer-events-none relative float-right -mr-1.5 -mt-1.5 mb-1 ml-3 h-[84px] w-[84px] rotate-[10deg] sm:-mr-1 sm:-mt-1 sm:h-[104px] sm:w-[104px] lg:hidden"
            >
              {rose ? <StickerConfetti side="right" className="absolute -inset-[30%]" /> : null}
              <PromoSticker sticker={sticker} uid={`w-${promo.slug}-m`} className="relative h-full w-full" />
            </div>
          ) : null}
          {badge ? (
            <span
              className={`relative inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                rose ? "bg-[#ff5a7a] text-white" : "bg-[#ffd27a] text-[#2a1a05]"
              }`}
            >
              {badge}
            </span>
          ) : null}
          <h3 className="relative mb-0 mt-4 font-serif text-[1.9rem] font-bold italic leading-[1.1] text-white sm:text-[2.2rem]">
            {text(promo.title, locale)}
          </h3>
          <p className="relative mb-0 mt-3 max-w-xl text-[15px] leading-7 text-[#c3cfdf]">{text(promo.description, locale)}</p>
        </div>

        {promo.slug === "birthday" ? <WinterBirthdayWindow locale={locale} /> : null}

        {promo.howItWorks ? (
          <div className="mt-4 max-w-xl rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8fa3bd]">{text(promo.howItWorks.title, locale)}</p>
            <ul className="m-0 mt-1.5 list-none space-y-1 p-0 text-[13.5px] leading-5 text-[#eef3fa]">
              {list(promo.howItWorks.lines, locale).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {rows.length ? (
          <div className="mt-5 overflow-x-auto">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8fa3bd]">{cols.how}</p>
            <table className="mt-2 w-full max-w-xl text-left text-sm sm:min-w-[22rem]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-[#8fa3bd]">
                  <th className="py-1.5 font-semibold" />
                  <th className="hidden py-1.5 text-right font-semibold sm:table-cell">{cols.one}</th>
                  <th className="py-1.5 text-right font-semibold">{cols.three}</th>
                  <th className="py-1.5 text-right font-semibold">{cols.per}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label.ru} className="border-t border-dashed border-white/15">
                    <td className="py-2 text-[#eef3fa]">{text(r.label, locale)}</td>
                    <td className="hidden py-2 text-right tabular-nums text-[#8fa3bd] line-through decoration-[#8fa3bd]/60 sm:table-cell">
                      {money(r.night * 3)}
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums text-[#eef3fa]">
                      <span className="block text-[11px] font-normal text-[#8fa3bd] line-through decoration-[#8fa3bd]/60 sm:hidden">
                        {money(r.night * 3)}
                      </span>
                      {money(r.total)}
                    </td>
                    <td className="py-2 pl-2 text-right text-base font-bold tabular-nums text-[#ffd27a] sm:text-lg">{money(r.perNight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mb-0 mt-1.5 text-[11px] text-[#8fa3bd]">{cols.note}</p>
          </div>
        ) : null}

        {discount && promo.discount ? (
          <WinterDiscountCalc d={discount} label={text(promo.discount.label, locale)} locale={locale} />
        ) : null}

        {/* Условия: на телефоне свёрнуты, на планшете списком, на компьютере — в корешке справа. */}
        <ul className="relative m-0 mt-auto hidden list-none p-0 pt-5 text-[12.5px] leading-6 text-[#a6b6cb] sm:block lg:hidden">
          {terms.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
        <details className="group/terms relative z-10 mt-auto pt-4 sm:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 text-sm font-semibold text-[#eef3fa] ring-1 ring-white/10 [&::-webkit-details-marker]:hidden">
            {TERMS_LABEL[locale]}
            <span aria-hidden className="text-lg leading-none transition-transform group-open/terms:rotate-45">
              +
            </span>
          </summary>
          <ul className="m-0 mt-2 list-none space-y-1 px-1 text-[13px] leading-5 text-[#a6b6cb]">
            {terms.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </details>

        <span aria-hidden className="hidden lg:block lg:h-6" />
        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center lg:mt-auto">
          <a
            href={links.oneClick}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ffd27a] px-5 py-2 text-center text-sm font-extrabold text-[#2a1a05] shadow-[0_14px_36px_-14px_rgba(255,210,122,0.9)] transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:bg-[#ffe0a0]"
          >
            {ONE_CLICK[locale]}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </a>
          {/* Полная загрузка, не клиентский переход: Exely поднимается только на свежей странице. */}
          <a
            href={links.engine}
            className="relative z-10 inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] px-5 py-2 text-center text-sm font-bold text-[#eef3fa] transition-colors duration-200 hover:border-[#ffd27a]"
          >
            {ENGINE_LABEL[locale]}
          </a>
        </div>
      </div>

      {/* Корешок купона — только на компьютере: стикер крупно и условия. */}
      <aside
        className={`relative hidden lg:flex lg:flex-col lg:items-center lg:rounded-2xl lg:border lg:border-dashed lg:px-6 lg:pb-6 lg:pt-7 ${
          rose ? "lg:border-[#ff8fa3]/45 lg:bg-[#ff5a7a]/[0.06]" : "lg:border-[#ffd27a]/40 lg:bg-[#ffd27a]/[0.05]"
        }`}
      >
        {sticker ? (
          <div
            aria-hidden="true"
            className="pointer-events-none relative hidden h-[132px] w-[132px] shrink-0 rotate-[10deg] transition-transform duration-300 group-hover:rotate-[4deg] group-hover:scale-105 lg:block"
          >
            {rose ? <StickerConfetti side="top" className="absolute -inset-[30%]" /> : null}
            <PromoSticker sticker={sticker} uid={`w-${promo.slug}-d`} className="relative h-full w-full" />
          </div>
        ) : null}
        <div className={`hidden w-full lg:block ${rose ? "lg:mt-9" : "lg:mt-6"}`}>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8fa3bd]">{TERMS_LABEL[locale]}</p>
          <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-[12.5px] leading-[1.45] text-[#a6b6cb]">
            {terms.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className={rose ? "text-[#ff8fa3]" : "text-[#ffd27a]"}>
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
}

/** «Было → стало» и цена с человека — те же числа, что на главной (discountMath). */
function WinterDiscountCalc({ d, label, locale }: { d: DiscountMath; label: string; locale: Locale }) {
  const c = DISCOUNT_COPY[locale];
  const cur = priceLabels.currencyShort[locale];
  return (
    <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8fa3bd]">{c.how}</p>
        <p className="mb-0 mt-2 text-[13px] text-[#a6b6cb]">{label}</p>
        <p className="mb-0 mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <s className="text-[#8fa3bd] decoration-[#8fa3bd]/60">{money(d.base)}</s>
          <span aria-hidden="true" className="text-[#ffd27a]">
            →
          </span>
          <b className="text-xl font-bold text-[#ffd27a]">{money(d.price)}</b>
          <span className="text-[13px] text-[#a6b6cb]">
            {cur} {c.night}
          </span>
        </p>
        <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
          <dt className="text-[#a6b6cb]">{c.discount}</dt>
          <dd className="m-0 font-semibold text-[#eef3fa]">−{d.percent}%</dd>
          <dt className="text-[#a6b6cb]">{c.saving}</dt>
          <dd className="m-0 font-semibold tabular-nums text-[#eef3fa]">
            {money(d.saving)} {c.savingPer}
          </dd>
        </dl>
        <p className="mb-0 mt-2 text-[12.5px] text-[#a6b6cb]">{c.breakfast}</p>
      </div>
      <div className="rounded-2xl bg-[#ffd27a]/[0.08] px-4 py-3 ring-1 ring-[#ffd27a]/35">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffd27a]">{c.four}</p>
        <p className="mb-0 mt-2 text-[13.5px] text-[#eef3fa]">{c.lead(d.guests)}</p>
        <p className="mb-0 mt-0.5 text-[13.5px] tabular-nums text-[#eef3fa]">{c.line(money(d.price), d.guests, money(d.perPerson))}</p>
        {/* Не font-serif: у Cormorant цифры «старинные», «600 000» читалось бы как «6оо ооо». */}
        <p className="mb-0 mt-2 text-xl font-bold tabular-nums text-white">{c.total(money(d.perPerson))}</p>
        <p className="m-0 text-[12.5px] text-[#a6b6cb]">{c.totalNote(d.guests)}</p>
      </div>
    </div>
  );
}

/** Окно скидки на день рождения: семь дней, в центре — торт. Декор; словами — подпись и условия. */
function WinterBirthdayWindow({ locale }: { locale: Locale }) {
  return (
    <div className="relative mt-5 w-full max-w-sm">
      <ol aria-hidden="true" className="m-0 grid list-none grid-cols-7 gap-1.5 p-0">
        {[-3, -2, -1, 0, 1, 2, 3].map((d) =>
          d === 0 ? (
            <li key={d} className="flex h-10 items-center justify-center rounded-xl bg-[#ff5a7a] text-white shadow-[0_8px_16px_-8px_rgba(255,90,122,0.9)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5c1.1 1.3 1.1 2.6 0 3.3-1.1-.7-1.1-2 0-3.3z" fill="currentColor" />
                <path d="M12 7.5v2.5" />
                <rect x="4" y="10" width="16" height="10" rx="2.5" />
                <path d="M4 14.5c1.4 1 2.7 1 4 0s2.6-1 4 0 2.6 1 4 0 2.6-1 4 0" />
              </svg>
            </li>
          ) : (
            <li key={d} className="flex h-10 items-center justify-center rounded-xl bg-white/[0.07] text-[13px] font-bold tabular-nums text-[#eef3fa]/80 ring-1 ring-[#ff8fa3]/30">
              {d < 0 ? `−${-d}` : `+${d}`}
            </li>
          ),
        )}
      </ol>
      <p className="mb-0 mt-2 text-center text-[12px] font-medium text-[#a6b6cb]">{BDAY_WINDOW[locale]}</p>
    </div>
  );
}
