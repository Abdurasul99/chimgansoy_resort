import type { Metadata } from "next";
import { partnersPage } from "@/content/partners";
import * as B from "@/content/partners-b2b";
import { resortImages } from "@/content/images";
import { PartnerRequestForm } from "@/components/sections/PartnerRequestForm";
import { ToDetailLink } from "@/components/partners/ToDetailLink";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { imageStyle } from "@/lib/images";
import { localizePath } from "@/i18n/routing";
import { INDUSTRY_KEYS } from "@/lib/partners/economics";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Партнёрский раздел (B2B) — лендинг, первая из двух страниц.
 *
 * Работа страницы — объяснить идею и масштаб и довести до рабочей панели
 * /partners/detail, где партнёр считает под себя. Тексты — src/content/partners-b2b.ts,
 * цифры расчёта — src/lib/partners/economics.ts.
 *
 * Только по прямой ссылке (владелец, 11.11.2026): noindex здесь, X-Robots-Tag
 * в next.config.ts, в карте сайта и навигации её нет. Пока только на русском —
 * /uz/ и /en/ показывают ту же русскую версию.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const t = { ru: B.seo.title, uz: B.seo.title, en: B.seo.title };
  const d = { ru: B.seo.description, uz: B.seo.description, en: B.seo.description };
  return buildMetadata(locale, { title: t, description: d }, "/partners", { noindex: true });
}

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const eyebrow = "text-xs font-bold uppercase tracking-[0.22em] text-[var(--sun-dark)]";
const h2 = "mt-3 font-serif text-4xl font-bold leading-[1.05] text-[var(--ink)] sm:text-5xl";
const lead = "mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-[var(--sun)] px-7 py-3.5 font-bold text-[var(--on-accent)] shadow-[var(--shadow-glow)] transition hover:bg-[var(--sun-dark)] hover:text-white";
const btnGhostDark = "inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3.5 font-bold text-white transition hover:bg-white/10";

const SEASON_COLORS: Record<string, string> = {
  winter: "#2d8fbf",
  spring: "#7fb069",
  summer: "#f4a52a",
  autumn: "#c4703a",
};

export default async function PartnersLanding({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const detail = localizePath(locale, "/partners/detail");
  const hero = resortImages[partnersPage.hero.image];
  const link = (href: string) => (href.startsWith("/") ? localizePath(locale, href) : href);

  return (
    <div lang="ru" className="bg-[var(--paper)]">
      {/* ── Первый экран ── */}
      <section className="relative isolate overflow-hidden bg-[var(--ink)]" aria-labelledby="b2b-hero-title">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={imageStyle(hero)} role="img" aria-label={hero.alt.ru} />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,29,37,0.92)_0%,rgba(18,29,37,0.7)_48%,rgba(18,29,37,0.25)_100%)]" />
        <p aria-hidden className="pointer-events-none absolute -bottom-8 right-2 select-none font-serif text-[9rem] font-bold leading-none text-white/[0.06] sm:text-[16rem]">
          1700
        </p>
        <div className={`${wrap} flex min-h-[82vh] flex-col justify-end pb-14 pt-24 sm:pb-20`}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--sun)]">{B.hero.eyebrow}</p>
          <h1 id="b2b-hero-title" className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {B.hero.titleLead} <em className="italic text-[var(--sun)]">{B.hero.titleAccent}</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">{B.hero.lead}</p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">{B.hero.text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ToDetailLink href={`${detail}#calculator`} source="hero" className={btnPrimary}>
              {B.hero.ctaPrimary} →
            </ToDetailLink>
            <a href="#numbers" className={btnGhostDark}>
              {B.hero.ctaSecondary} ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Лента фактов ── */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-warm)]">
        <ul className={`${wrap} flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 text-sm font-semibold text-[var(--ink)]/80`}>
          {B.ticker.map((t, i) => (
            <li key={t} className="flex items-center gap-6">
              {i > 0 && <span aria-hidden className="text-[var(--sun-dark)]">▲</span>}
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* ── 01 · Цифры ── */}
      <section id="numbers" className={`${wrap} scroll-mt-24 py-16 sm:py-24`}>
        <p className={eyebrow}>{B.facts.eyebrow}</p>
        <h2 className={h2}>{B.facts.title}</h2>
        <p className={lead}>{B.facts.lead}</p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {B.facts.items.map((f, i) => (
            <article key={f.label} className="flex flex-col rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                {f.label} <span className="text-[var(--sun-dark)]">/ 0{i + 1}</span>
              </p>
              <p className="mt-3 whitespace-nowrap font-serif text-5xl font-bold leading-none text-[var(--ink)]">
                {f.value}
                {f.unit && <span className="ml-2 font-sans text-base font-semibold text-[var(--muted)]">{f.unit}</span>}
              </p>
              <h3 className="mt-5 text-base font-bold text-[var(--ink)]">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{f.text}</p>
              {f.link && (
                <ToDetailLink href={link(f.link.href)} source="numbers" className="mt-4 text-sm font-bold text-[var(--sun-dark)] hover:underline">
                  {f.link.label} →
                </ToDetailLink>
              )}
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-2xl font-bold text-[var(--ink)]">{B.seasonsBlock.title}</h3>
            <p className="text-sm text-[var(--muted)]">{B.seasonsBlock.note}</p>
          </div>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full" role="img" aria-label={B.seasonsBlock.items.map((s) => `${s.name} ${s.pct} %`).join(", ")}>
            {B.seasonsBlock.items.map((s) => (
              <span key={s.key} style={{ width: `${s.pct}%`, background: SEASON_COLORS[s.key] }} />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {B.seasonsBlock.items.map((s) => (
              <div key={s.key}>
                <p className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEASON_COLORS[s.key] }} />
                  {s.name} · {s.pct} %
                </p>
                <p className="mt-1 text-sm text-[var(--ink)]/80">{s.guests} гостей</p>
                <p className="text-xs leading-5 text-[var(--muted)]">{s.months} · {s.peak}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">{B.facts.note}</p>
      </section>

      {/* ── 02 · Модель ── */}
      <section id="model" className="scroll-mt-24 bg-[var(--surface-warm)] py-16 sm:py-24">
        <div className={wrap}>
          <p className={eyebrow}>{B.model.eyebrow}</p>
          <h2 className={h2}>{B.model.title}</h2>
          <p className={lead}>{B.model.lead}</p>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {B.model.items.map((m) => (
              <article key={m.tag} className="rounded-3xl bg-[var(--paper)] p-7 shadow-[var(--shadow-card)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sun-dark)]">{m.tag}</p>
                <h3 className="mt-3 font-serif text-3xl font-bold leading-tight text-[var(--ink)]">{m.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">{m.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 · Отрасли ── */}
      <section id="industries" className={`${wrap} scroll-mt-24 py-16 sm:py-24`}>
        <p className={eyebrow}>{B.industries.eyebrow}</p>
        <h2 className={h2}>{B.industries.title}</h2>
        <p className={lead}>{B.industries.lead}</p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_KEYS.map((k) => {
            const c = B.industries.items[k];
            return (
              <article key={k} className="group flex flex-col rounded-3xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--sun)] hover:shadow-[var(--shadow-card-hover)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{c.code}</p>
                <h3 className="mt-2 font-serif text-3xl font-bold text-[var(--ink)]">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--ink)]/80">{c.task}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">Зоны: </span>
                  {c.zones}
                </p>
                <ToDetailLink
                  href={`${detail}?industry=${k}&pkg=${c.pkg}#calculator`}
                  source="industries"
                  className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-[var(--surface-warm)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition group-hover:bg-[var(--sun)] group-hover:text-[var(--on-accent)]"
                >
                  Рассчитать сценарий →
                </ToDetailLink>
              </article>
            );
          })}
          <article className="flex flex-col justify-center rounded-3xl bg-[var(--ink)] p-6 text-white">
            <p className="font-serif text-2xl font-bold leading-snug">Не нашли свою отрасль?</p>
            <p className="mt-2 text-sm leading-6 text-white/70">Калькулятор принимает любые значения ER, CR, LTV и маржи — задайте свои.</p>
            <ToDetailLink href={`${detail}#calculator`} source="industries_other" className="mt-5 self-start font-bold text-[var(--sun)] hover:underline">
              Открыть калькулятор →
            </ToDetailLink>
          </article>
        </div>
      </section>

      {/* ── 04 · Годовой контракт ── */}
      <section id="bonus" className="scroll-mt-24 bg-[var(--ink)] py-16 text-white sm:py-24">
        <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-2`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{B.bonus.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl font-bold leading-[1.05] sm:text-5xl">{B.bonus.title}</h2>
            <p className="mt-5 text-lg leading-8 text-white/80">{B.bonus.text}</p>
            <ToDetailLink href={`${detail}?bonus=annual#calculator`} source="bonus" className={`${btnPrimary} mt-8`}>
              {B.bonus.cta} →
            </ToDetailLink>
          </div>
          <ul className="space-y-3">
            {B.bonus.points.map((p) => (
              <li key={p} className="flex gap-4 rounded-2xl bg-white/[0.06] p-5">
                <span aria-hidden className="mt-0.5 text-[var(--sun)]">✓</span>
                <span className="text-[15px] leading-6 text-white/85">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 05 · Инструменты ── */}
      <section id="transition" className={`${wrap} scroll-mt-24 py-16 sm:py-24`}>
        <p className={eyebrow}>{B.tools.eyebrow}</p>
        <h2 className={h2}>{B.tools.title}</h2>
        <p className={lead}>{B.tools.lead}</p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {B.tools.items.map((t, i) => (
            <ToDetailLink
              key={t.title}
              href={`${detail}${t.href}`}
              source="tools"
              className="group flex flex-col rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="font-serif text-4xl font-bold text-[var(--sun)]">0{i + 1}</span>
              <span className="mt-3 text-lg font-bold leading-snug text-[var(--ink)]">{t.title}</span>
              <span className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{t.text}</span>
              <span className="mt-4 text-sm font-bold text-[var(--sun-dark)] group-hover:underline">Открыть →</span>
            </ToDetailLink>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start gap-3 rounded-3xl bg-[var(--surface-warm)] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="font-serif text-3xl font-bold text-[var(--ink)]">Здесь — идея. Там — цифры под ваш бюджет.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{B.tools.ctaNote}</p>
          </div>
          <ToDetailLink href={`${detail}#calculator`} source="transition" className={`${btnPrimary} shrink-0`}>
            {B.tools.cta} →
          </ToDetailLink>
        </div>
      </section>

      {/* ── Заявка ── */}
      <section id="request" className="scroll-mt-24 border-t border-[var(--line)] bg-[var(--surface)] py-16 sm:py-24">
        <div className={`${wrap} grid grid-cols-1 gap-10 lg:grid-cols-2`}>
          <div>
            <p className={eyebrow}>Следующий шаг</p>
            <h2 className={h2}>{B.request.title}</h2>
            <p className={lead}>{B.request.lead}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <PartnerRequestForm locale={locale} hideProgram />
          </div>
        </div>
      </section>
    </div>
  );
}
