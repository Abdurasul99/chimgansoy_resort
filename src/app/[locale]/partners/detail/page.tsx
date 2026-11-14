import type { Metadata } from "next";
import Link from "next/link";
import * as B from "@/content/partners-b2b";
import { Workbench } from "@/components/partners/Workbench";
import { ZoneMap } from "@/components/partners/ZoneMap";
import { PriceTable } from "@/components/partners/PriceTable";
import { Calculator } from "@/components/partners/Calculator";
import { Memorandum } from "@/components/partners/Memorandum";
import { DetailRequest } from "@/components/partners/DetailRequest";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { localizePath } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Рабочая панель партнёра — вторая страница пары: карта носителей, прайс,
 * калькулятор, методология, меморандум и заявка. Весь расчёт — одна модель
 * (src/lib/partners/economics.ts) и одно состояние (Workbench), поэтому карта,
 * прайс, калькулятор, меморандум и заявка всегда показывают одни и те же цифры.
 *
 * noindex, как весь раздел; X-Robots-Tag даёт правило /partners/:path* в next.config.ts.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const t = { ru: B.seo.detailTitle, uz: B.seo.detailTitle, en: B.seo.detailTitle };
  const d = { ru: B.seo.detailDescription, uz: B.seo.detailDescription, en: B.seo.detailDescription };
  return buildMetadata(locale, { title: t, description: d }, "/partners/detail", { noindex: true });
}

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const eyebrow = "text-xs font-bold uppercase tracking-[0.22em] text-[var(--sun-dark)]";
const h2 = "mt-3 font-serif text-4xl font-bold leading-[1.05] text-[var(--ink)] sm:text-5xl";
const lead = "mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]";

const NAV = [
  { href: "#map", label: "Карта" },
  { href: "#price", label: "Прайс" },
  { href: "#calculator", label: "Калькулятор" },
  { href: "#methodology", label: "Методология" },
  { href: "#memorandum", label: "Меморандум" },
  { href: "#request", label: "Заявка" },
];

const TYPE_STYLE: Record<B.DataRow["type"], string> = {
  Факт: "bg-[var(--forest)]/10 text-[var(--forest-dark)]",
  Бенчмарк: "bg-[var(--sky)]/15 text-[var(--sky-dark)]",
  "Оценка курорта": "bg-[var(--sun)]/15 text-[var(--sun-dark)]",
  Допущение: "bg-[var(--mist)] text-[var(--ink)]/80",
};

export default async function PartnersDetail({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const landing = localizePath(locale, "/partners");

  return (
    <div lang="ru" className="bg-[var(--paper)]">
      <Workbench>
        {/* ── Шапка панели ── */}
        <section className="border-b border-[var(--line)] bg-[var(--surface-warm)] print:hidden">
          <div className={`${wrap} pb-10 pt-10 sm:pt-14`}>
            <Link href={`${landing}#transition`} className="text-sm font-bold text-[var(--sun-dark)] hover:underline">
              {B.detailIntro.back}
            </Link>
            <p className={`${eyebrow} mt-6`}>{B.detailIntro.eyebrow}</p>
            <h1 className="mt-3 font-serif text-5xl font-bold leading-[1.02] text-[var(--ink)] sm:text-6xl">{B.detailIntro.title}</h1>
            <p className={lead}>{B.detailIntro.lead}</p>
          </div>
        </section>

        {/* ── Навигация по разделам ── */}
        <nav aria-label="Разделы панели" className="sticky top-[4.5rem] z-40 border-b border-[var(--line)] bg-[var(--glass-bg-strong)] backdrop-blur print:hidden">
          <ul className={`${wrap} flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]`}>
            {NAV.map((n) => (
              <li key={n.href} className="shrink-0">
                <a href={n.href} className="block rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink)]/75 transition hover:bg-[var(--surface-warm)] hover:text-[var(--ink)]">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── 01 · Карта ── */}
        <section id="map" className={`${wrap} scroll-mt-36 py-14 sm:py-20 print:hidden`}>
          <p className={eyebrow}>{B.mapBlock.eyebrow}</p>
          <h2 className={h2}>{B.mapBlock.title}</h2>
          <p className={lead}>{B.mapBlock.lead}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {B.mapBlock.chips.map((c) => (
              <li key={c} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]/85">{c}</li>
            ))}
          </ul>
          <div className="mt-8">
            <ZoneMap />
          </div>
        </section>

        {/* ── 02 · Прайс ── */}
        <section id="price" className="scroll-mt-36 bg-[var(--surface)] py-14 sm:py-20 print:hidden">
          <div className={wrap}>
            <p className={eyebrow}>{B.priceBlock.eyebrow}</p>
            <h2 className={h2}>{B.priceBlock.title}</h2>
            <p className={lead}>{B.priceBlock.lead}</p>
            <div className="mt-8">
              <PriceTable />
            </div>
            <ul className="mt-6 space-y-2 text-sm leading-6 text-[var(--muted)]">
              {B.priceBlock.rules.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="text-[var(--sun-dark)]">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 03 · Калькулятор ── */}
        <section id="calculator" className={`${wrap} scroll-mt-36 py-14 sm:py-20 print:hidden`}>
          <p className={eyebrow}>{B.calcBlock.eyebrow}</p>
          <h2 className={h2}>{B.calcBlock.title}</h2>
          <p className={lead}>{B.calcBlock.lead}</p>
          <div className="mt-8">
            <Calculator />
          </div>
        </section>

        {/* ── 04 · Методология ── */}
        <section id="methodology" className="scroll-mt-36 bg-[var(--surface-warm)] py-14 sm:py-20 print:hidden">
          <div className={wrap}>
            <p className={eyebrow}>{B.methodology.eyebrow}</p>
            <h2 className={h2}>{B.methodology.title}</h2>
            <p className={lead}>{B.methodology.lead}</p>
            <div className="mt-8 divide-y divide-[var(--line)] overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
              {B.methodology.items.map((m) => (
                <details key={m.n} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface)] sm:px-7 sm:py-5">
                    <span className="font-serif text-2xl font-bold text-[var(--sun)]">{m.n}</span>
                    <span className="flex-1 text-base font-bold text-[var(--ink)] sm:text-lg">{m.title}</span>
                    <span className="hidden text-xs font-semibold text-[var(--muted)] sm:block">{m.type}</span>
                    <span aria-hidden className="text-xl text-[var(--muted)] transition group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-5 pb-6 sm:px-7 sm:pl-[4.6rem]">
                    <p className="text-[15px] leading-7 text-[var(--ink)]/85">{m.text}</p>
                    {m.formula && (
                      <p className="mt-3 rounded-xl bg-[var(--surface)] px-4 py-3 font-mono text-[13px] leading-6 text-[var(--ink)]">{m.formula}</p>
                    )}
                    <p className="mt-2 text-xs text-[var(--muted)] sm:hidden">{m.type}</p>
                  </div>
                </details>
              ))}
            </div>

            <h3 className="mt-12 font-serif text-3xl font-bold text-[var(--ink)]">Реестр данных</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Факт — измерено или закреплено законом. Бенчмарк — внешний опубликованный источник. Оценка курорта — внутренняя оценка по операционным данным.
              Допущение — редактируется в калькуляторе.
            </p>
            <div className="mt-5 overflow-x-auto rounded-3xl bg-white shadow-[var(--shadow-card)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-bold">Параметр</th>
                    <th scope="col" className="px-4 py-3 font-bold">Значение</th>
                    <th scope="col" className="px-4 py-3 font-bold">Тип</th>
                    <th scope="col" className="px-5 py-3 font-bold">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {B.dataRegistry.map((d) => (
                    <tr key={d.name} className="border-t border-[var(--line)]">
                      <td className="px-5 py-3 font-semibold text-[var(--ink)]">{d.name}</td>
                      <td className="px-4 py-3 text-[var(--ink)]/85">{d.value}</td>
                      <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${TYPE_STYLE[d.type]}`}>{d.type}</span></td>
                      <td className="px-5 py-3 text-[var(--muted)]">{d.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 05 · Меморандум ── */}
        <section id="memorandum" className={`${wrap} scroll-mt-36 py-14 sm:py-20 print:p-0`}>
          <div className="print:hidden">
            <p className={eyebrow}>{B.memo.eyebrow}</p>
            <h2 className={h2}>{B.memo.title}</h2>
            <p className={`${lead} mb-8`}>{B.memo.lead}</p>
          </div>
          <Memorandum />
        </section>

        {/* ── Заявка ── */}
        <section id="request" className="scroll-mt-36 border-t border-[var(--line)] bg-[var(--surface)] py-14 sm:py-20 print:hidden">
          <div className={`${wrap} grid grid-cols-1 gap-10 lg:grid-cols-2`}>
            <div>
              <p className={eyebrow}>Следующий шаг</p>
              <h2 className={h2}>{B.request.title}</h2>
              <p className={lead}>Ваш расчёт — отрасль, пакет, бюджет и ROMI — придёт менеджеру вместе с заявкой. Разговор начнётся с вашего сценария.</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
              <DetailRequest locale={locale} />
            </div>
          </div>
        </section>
      </Workbench>
    </div>
  );
}
