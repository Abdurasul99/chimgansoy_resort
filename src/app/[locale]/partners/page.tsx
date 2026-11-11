import type { Metadata } from "next";
import { partnersPage as P } from "@/content/partners";
import { resortImages } from "@/content/images";
import { PartnerRequestForm } from "@/components/sections/PartnerRequestForm";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Партнёрский раздел (B2B), общая страница.
 *
 * Только по прямой ссылке (владелец, 11.11.2026): noindex здесь, X-Robots-Tag
 * в next.config.ts, в карте сайта и навигации её нет. Тексты и фото — в
 * src/content/partners.ts, здесь только разметка.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, P.seo, "/partners", { noindex: true });
}

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const h2 = "font-serif text-3xl font-bold text-[var(--ink)] sm:text-4xl";

export default async function PartnersPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const t = (s: Parameters<typeof text>[0]) => text(s, locale);
  const hero = resortImages[P.hero.image];

  return (
    <>
      {/* ── Первый экран ── */}
      <section className="relative isolate -mt-[4.5rem] flex min-h-[78vh] items-end overflow-hidden bg-[var(--ink)]" aria-label={t(P.hero.title)}>
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={imageStyle(hero)} role="img" aria-label={t(hero.alt)} />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.96)_0%,rgba(12,18,14,0.55)_55%,rgba(12,18,14,0.15)_100%)]" />
        <div className={`${wrap} pb-12 pt-32 sm:pb-20`}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{t(P.hero.eyebrow)}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">{t(P.hero.title)}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{t(P.hero.lead)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#programs" className="rounded-full bg-[var(--sun)] px-6 py-3.5 font-bold text-[var(--ink)] transition hover:bg-[var(--sun-dark)]">
              {t(P.hero.cta)}
            </a>
            <a href="#request" className="rounded-full border border-white/40 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">
              {t(P.hero.ctaSecondary)}
            </a>
          </div>
        </div>
      </section>

      {/* ── Цифры ── */}
      <section className={`${wrap} py-12 sm:py-16`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {P.facts.items.map((f) => (
            <div key={f.value + f.label.ru} className="rounded-2xl bg-[var(--surface-warm)] p-6">
              <p className="font-serif text-4xl font-bold text-[var(--ink)]">{f.value}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]/70">{t(f.label)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--ink)]/50">{t(P.facts.note)}</p>
      </section>

      {/* ── Локация ── */}
      <section className={`${wrap} grid grid-cols-1 items-center gap-8 pb-16 lg:grid-cols-2`}>
        <div className="aspect-[4/3] rounded-3xl bg-cover bg-center" style={imageStyle(resortImages[P.location.image])} role="img" aria-label={t(resortImages[P.location.image].alt)} />
        <div>
          <h2 className={h2}>{t(P.location.title)}</h2>
          <p className="mt-4 text-base leading-7 text-[var(--ink)]/75">{t(P.location.text)}</p>
        </div>
      </section>

      {/* ── Территория ── */}
      <section className="bg-[var(--surface)] py-16">
        <div className={wrap}>
          <h2 className={h2}>{t(P.territory.title)}</h2>
          <p className="mt-3 max-w-2xl text-[var(--ink)]/70">{t(P.territory.lead)}</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {P.territory.items.map((it) => (
              <article key={it.image} className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
                <div className="aspect-[4/3] bg-cover bg-center" style={imageStyle(resortImages[it.image])} role="img" aria-label={t(resortImages[it.image].alt)} />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[var(--ink)]">{t(it.title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink)]/70">{t(it.text)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] p-5">
            <p className="text-sm font-bold text-[var(--ink)]">{t(P.territory.planned.title)}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--ink)]/70">{t(P.territory.planned.text)}</p>
          </div>
        </div>
      </section>

      {/* ── Сезоны ── */}
      <section className={`${wrap} py-16`}>
        <h2 className={h2}>{t(P.seasons.title)}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {P.seasons.items.map((s) => (
            <div key={s.title.ru} className="rounded-2xl border border-[var(--line)] p-6">
              <h3 className="text-lg font-bold text-[var(--ink)]">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]/70">{t(s.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Путь гостя ── */}
      <section className="bg-[var(--ink)] py-16 text-white">
        <div className={wrap}>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{t(P.journey.title)}</h2>
          <p className="mt-3 max-w-2xl text-white/70">{t(P.journey.lead)}</p>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {P.journey.steps.map((s, i) => (
              <li key={s.title.ru} className="rounded-2xl bg-white/[0.06] p-5">
                <p className="text-xs font-bold text-[var(--sun)]">0{i + 1}</p>
                <p className="mt-2 text-lg font-bold">{t(s.title)}</p>
                <p className="mt-1 text-sm leading-6 text-white/65">{t(s.partner)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Программы ── */}
      <section id="programs" className={`${wrap} scroll-mt-24 py-16`}>
        <h2 className={h2}>{t(P.programs.title)}</h2>
        <p className="mt-3 max-w-2xl text-[var(--ink)]/70">{t(P.programs.lead)}</p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {P.programs.items.map((p) => (
            <article key={p.id} id={p.id} className="scroll-mt-24 rounded-3xl border border-[var(--line)] p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-[var(--ink)]">{t(p.title)}</h3>
              <p className="mt-1 text-sm text-[var(--ink)]/60">{t(p.who)}</p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t(P.programs.guestLabel)}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--ink)]/80">{t(p.guest)}</p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t(P.programs.rightsLabel)}</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--ink)]/80">
                {p.rights[locale].map((r) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden className="text-[var(--sun-dark)]">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm">
                <span className="font-bold text-[var(--ink)]">{t(P.programs.measureLabel)}: </span>
                <span className="text-[var(--ink)]/75">{t(p.measure)}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Как начать + заявка ── */}
      <section id="request" className="scroll-mt-24 bg-[var(--surface-warm)] py-16">
        <div className={`${wrap} grid grid-cols-1 gap-10 lg:grid-cols-2`}>
          <div>
            <h2 className={h2}>{t(P.start.title)}</h2>
            <ol className="mt-6 space-y-4">
              {P.start.steps[locale].map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-sm font-bold text-[var(--ink)]">{i + 1}</span>
                  <span className="pt-1 text-base text-[var(--ink)]/85">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm leading-6 text-[var(--ink)]/65">{t(P.start.note)}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t(P.form.title)}</h2>
            <p className="mb-6 mt-2 text-sm text-[var(--ink)]/70">{t(P.form.lead)}</p>
            <PartnerRequestForm locale={locale} />
          </div>
        </div>
      </section>
    </>
  );
}
