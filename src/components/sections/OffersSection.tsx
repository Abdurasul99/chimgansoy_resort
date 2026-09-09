import { promotions } from "@/content/promotions";
import { todayTashkent } from "@/lib/promo-nights";
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
  const active = promotions.filter((p) => !p.until || today <= p.until);
  const [lead, ...rest] = active;

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

            {lead.savings ? (
              <div className="mt-5 max-w-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {dict.home.offersSaving}
                </p>
                <dl className="mt-2">
                  {lead.savings.map((s) => (
                    <div
                      key={text(s.label, "ru")}
                      className="flex items-baseline justify-between gap-4 border-b border-dashed border-[color:var(--line)] py-1.5 last:border-b-0"
                    >
                      <dt className="text-sm text-[var(--ink)]">{text(s.label, locale)}</dt>
                      {/* «от», потому что выгода зависит от тарифа даты: в
                          выходные ночь дороже будней, точного числа нет. */}
                      <dd className="text-lg font-bold tabular-nums text-[var(--accent)]">
                        <span className="text-[11px] font-semibold opacity-70">
                          {dict.from}{" "}
                        </span>
                        {money(s.amount)}
                        <span className="text-[11px] font-semibold opacity-70">{" "}{text(priceLabels.currencyShort, locale)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
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
