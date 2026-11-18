import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { partnersPage as P } from "@/content/partners";
import { contacts } from "@/content/contacts";
import { getLocaleParam } from "@/lib/content";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";
import { isExpired, isOfferKey, money, type Offer } from "@/lib/partners/model";
import * as store from "@/lib/partners/store";
import { ContractButton, OfferBeacon } from "./OfferClient";

/**
 * Персональное предложение компании — содержимое из админки
 * (chimgandarbaza.uz/ru/adminpartners). Только по ссылке: noindex здесь и
 * X-Robots-Tag на всё /partners/* в next.config.ts. Нет записи или ссылка
 * отозвана — обычная 404, без намёка, что адрес когда-то существовал.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; key: string }> };

const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/**
 * «30 ноября 2026 г.», «2026-yil 30-noyabr», «30 November 2026». Узбекский —
 * вручную: ICU в Node отдаёт для uz «30-noyabr, 2026», а по правилам год идёт
 * первым, с «-yil», и месяц со строчной.
 */
function offerDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (locale === "uz") return `${y}-yil ${d}-${UZ_MONTHS[m - 1]}`;
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

async function load(key: string): Promise<Offer | null> {
  if (!isOfferKey(key)) return null;
  const offer = await store.getOfferByKey(key);
  return offer && !offer.revoked ? offer : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const locale = await getLocaleParam(params);
  const offer = await load(key).catch(() => null);
  return {
    title: { absolute: offer ? `${text(P.offer.eyebrow, locale)} — ${offer.company} | Chimgan Darbaza Resort` : "Chimgan Darbaza Resort" },
    robots: { index: false, follow: false },
  };
}

export default async function OfferPage({ params }: Props) {
  const { key } = await params;
  const locale = await getLocaleParam(params);
  const t = (s: Parameters<typeof text>[0]) => text(s, locale);
  const offer = await load(key);
  if (!offer) notFound();

  const expired = isExpired(offer);
  const programs = P.programs.items.filter((p) => offer.programs.includes(p.id));
  const until = offer.validUntil ? offerDate(offer.validUntil, locale) : "";
  const labels = { request: t(P.offer.request), requesting: t(P.offer.requesting), requested: t(P.offer.requested) };

  return (
    <>
      <OfferBeacon offerKey={offer.key} />

      {/* ── Шапка предложения ── */}
      <section className="-mt-[4.5rem] bg-[var(--ink)] pb-12 pt-28 text-white sm:pb-16 sm:pt-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{t(P.offer.eyebrow)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
            {offer.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.logo} alt={offer.company} className="max-h-16 w-auto max-w-[240px] object-contain sm:max-h-20" />
            ) : (
              <span className="font-serif text-4xl font-bold sm:text-5xl">{offer.company}</span>
            )}
            <span className="text-white/40">×</span>
            <span className="font-serif text-2xl font-bold sm:text-3xl">Chimgan Darbaza Resort</span>
          </div>
          {offer.lead && <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-7 text-white/75 sm:text-lg">{offer.lead}</p>}
          {until && (
            <p className={`mt-6 inline-block rounded-full px-4 py-2 text-sm font-semibold ${expired ? "bg-red-500/20 text-red-200" : "bg-white/10 text-white/80"}`}>
              {expired ? t(P.offer.expired) : t(P.offer.validUntil).replace("{date}", until)}
            </p>
          )}
        </div>
      </section>

      {/* ── Программы ── */}
      {programs.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-serif text-3xl font-bold text-[var(--ink)]">{t(P.offer.programs)}</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {programs.map((p) => (
              <article key={p.id} className="rounded-3xl border border-[var(--line)] p-6">
                <h3 className="text-xl font-bold text-[var(--ink)]">{t(p.title)}</h3>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t(P.programs.guestLabel)}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--ink)]/80">{t(p.guest)}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t(P.programs.rightsLabel)}</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--ink)]/80">
                  {p.rights[locale].map((r) => (
                    <li key={r} className="flex gap-2"><span aria-hidden className="text-[var(--accent-ink)]">•</span><span>{r}</span></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Пакеты ── */}
      {offer.packages.length > 0 && (
        <section className="bg-[var(--surface-warm)] py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl font-bold text-[var(--ink)]">{t(P.offer.packages)}</h2>
            <div className={`mt-6 grid grid-cols-1 gap-5 ${offer.packages.length > 1 ? "md:grid-cols-2" : ""} ${offer.packages.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {offer.packages.map((pkg, i) => (
                <article key={i} className="flex flex-col rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-xl font-bold text-[var(--ink)]">{pkg.title}</h3>
                  <p className="mt-3">
                    {pkg.price > 0 ? (
                      <>
                        <span className="font-serif text-3xl font-bold text-[var(--ink)]">{money(pkg.price)}</span>{" "}
                        <span className="text-sm text-[var(--ink)]/60">{t(P.offer.noVat)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-[var(--ink)]">{t(P.offer.onRequest)}</span>
                    )}
                  </p>
                  {pkg.note && <p className="mt-1 text-xs text-[var(--ink)]/55">{pkg.note}</p>}
                  {pkg.items.length > 0 && (
                    <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-[var(--ink)]/80">
                      {pkg.items.map((it) => (
                        <li key={it} className="flex gap-2"><span aria-hidden className="text-[var(--accent)]">✓</span><span>{it}</span></li>
                      ))}
                    </ul>
                  )}
                  {!expired && (
                    <div className="mt-6">
                      <ContractButton offerKey={offer.key} index={i} labels={labels} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Связь и общая страница ── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-[var(--line)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-lg font-bold text-[var(--ink)]">{t(P.offer.contact)}</p>
            <a href={`tel:${contacts.phone.replace(/\s/g, "")}`} className="mt-1 block text-2xl font-bold text-[var(--ink)] underline-offset-4 hover:underline">
              {contacts.phone}
            </a>
            {/* Без пакетов кнопка договора живёт здесь — иначе её негде нажать. */}
            {!expired && offer.packages.length === 0 && (
              <div className="mt-4 max-w-xs"><ContractButton offerKey={offer.key} index={-1} labels={labels} /></div>
            )}
          </div>
          <a href={localizePath(locale, "/partners")} className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--surface)]">
            {t(P.offer.about)} →
          </a>
        </div>
      </section>
    </>
  );
}
