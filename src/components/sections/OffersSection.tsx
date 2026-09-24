import { promotions } from "@/content/promotions";
import { promoBookable, promoBreakdown, todayTashkent } from "@/lib/promo-nights";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text, list } from "@/lib/localize";
import { money } from "@/lib/tariff";
import { priceLabels } from "@/content/pricing";

type Props = { locale: Locale };

/**
 * Действующие акции — три карточки.
 *
 * Стоят выше отзывов и галереи: акция отвечает на вопрос «почему сейчас», а
 * фотографии — на «как там». Гость, пришедший из сторис, должен увидеть повод
 * раньше, чем начнёт листать.
 *
 * Карточки разной величины намеренно: у «2+1» есть цифра выгоды, и она
 * занимает всю ширину. Три одинаковые плитки читались бы как список условий, а
 * это предложения с разным весом.
 *
 * Ссылка каждой карточки несёт slug акции в utm_content — в заявке будет
 * видно, что именно сработало. Те же метки стоят на визитке из шапки
 * Instagram, поэтому статистика по акции собирается с обоих входов сразу.
 */
export function OffersSection({ locale }: Props) {
  const dict = dictionaries[locale];
  /*
   * Просроченная акция уходит со страницы сама.
   *
   * У «2+1» есть срок — до 30.09.2026. Без этой проверки первого октября
   * гость прочитал бы про третью ночь в подарок, приехал за ней и услышал на
   * ресепшене, что акция кончилась. Дата берётся по Ташкенту: сайт живёт там,
   * а не там, где сервер.
   */
  const today = todayTashkent();
  // У «2+1» мерилом служит последний заезд, а не дата срока: срок — 30.09, но
  // три ночи с заездом 29-го уже в октябре, и карточка звала бы на даты,
  // которых нет. Остальные акции живут до своей даты.
  const active = promotions.filter(
    (p) =>
      (p.slug === "2plus1" ? promoBookable(today) : !p.until || today <= p.until) &&
      !p.hiddenOnSite,
  );
  const [lead, ...rest] = active;
  const rows = lead?.slug === "2plus1" ? promoBreakdown() : [];
  const cols = {
    ru: { how: "Как считается", one: "3 ночи без акции", three: "3 ночи по акции", per: "За ночь", note: "Суммы в сумах, ночи с воскресенья по четверг. Завтрак включён, обед и ужин («Всё включено») — отдельно." },
    uz: { how: "Qanday hisoblanadi", one: "3 kecha aksiyasiz", three: "3 kecha aksiyada", per: "Kechasi", note: "Summalar so'mda, yakshanbadan payshanbagacha bo'lgan kechalar. Nonushta kiritilgan, tushlik va kechki ovqat («Hammasi kiritilgan») — alohida." },
    en: { how: "How it adds up", one: "3 nights, no offer", three: "3 nights, offer", per: "Per night", note: "UZS, Sunday–Thursday nights. Breakfast included; lunch and dinner (All-Inclusive) are extra." },
  }[locale];

  const href = (slug: string) =>
    `${localizePath(locale, "/bron")}?utm_source=site&utm_medium=offers&utm_content=${slug}`;

  if (!lead) return null;

  return (
    <section className="bg-[var(--surface-warm)] px-4 py-16 sm:px-6 lg:px-8" id="offers">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          {dict.home.offersEyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
          {dict.home.offersTitle}
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Ведущая акция — на две колонки из трёх: у неё есть сумма выгоды. */}
          <a
            href={href(lead.slug)}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-7 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:col-span-2"
          >
            <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--sun)] to-transparent" />
            <span className="self-start rounded-full bg-[var(--sun)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
              {text(lead.badge, locale)}
            </span>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              {text(lead.title, locale)}
            </h3>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
              {text(lead.description, locale)}
            </p>

            {/* Расписание питания — и когда «Всё включено» стоит ведущей
                карточкой. 29–30.09 «2+1» уже снята (заехать по ней нельзя), и
                без этого блока расписание пропадало на два дня: ведущий шаблон
                умел только расчёт «2+1». */}
            {lead.howItWorks ? (
              <div className="mt-4 max-w-xl rounded-2xl bg-[var(--surface-warm)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {text(lead.howItWorks.title, locale)}
                </p>
                <ul className="mt-1.5 space-y-1 text-[13.5px] leading-5 text-[var(--ink)]">
                  {list(lead.howItWorks.lines, locale).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/*
                Расчёт «2+1» — так, как его объясняет гостям оператор: сколько
                стоит ночь, сколько три ночи по акции и во что это выходит за
                ночь. «Ночь в Чимгане за 1 000 000» — это и есть предложение, и
                гость должен увидеть, откуда оно берётся, а не поверить на слово.
                Цифры считаются из тарифа в promotions.ts, в тексте их нет.
            */}
            {rows.length ? (
              <div className="mt-5 overflow-x-auto">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {cols.how}
                </p>
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

            <ul className="mt-auto pt-5 text-[12.5px] leading-6 text-[var(--muted)]">
              {list(lead.terms, locale).map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </a>

          {rest.map((promo) => (
            <a
              key={promo.slug}
              href={href(promo.slug)}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-7 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--sun)] to-transparent" />
              <span className="self-start rounded-full bg-[var(--ink)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                {text(promo.badge, locale)}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold text-[var(--ink)]">
                {text(promo.title, locale)}
              </h3>
              <p className="mt-3 text-[14.5px] leading-6 text-[var(--muted)]">
                {text(promo.description, locale)}
              </p>
              {promo.howItWorks ? (
                <div className="mt-4 rounded-2xl bg-[var(--surface-warm)] px-4 py-3">
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
              <ul className="mt-auto pt-5 text-[12.5px] leading-6 text-[var(--muted)]">
                {list(promo.terms, locale).map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
