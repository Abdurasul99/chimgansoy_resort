"use client";

import { useEffect, useState } from "react";
import { PACKAGES } from "@/lib/partners/economics";
import { fmtPct, fmtSum, fmtX } from "@/lib/partners/format";
import { memo, priceBlock } from "@/content/partners-b2b";
import { trackEvent } from "@/lib/analytics";
import { useWorkbench } from "./Workbench";
import { paramRows, resultGroups } from "./rows";

/**
 * Меморандум — тот же расчёт, что в калькуляторе, сверстанный как документ A4.
 * PDF делает сам браузер через печать: при печати видна только эта секция
 * (print:hidden у остальных блоков страницы).
 */
export function Memorandum() {
  const { state, result, qualification, annualBonus } = useWorkbench();
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    const now = new Date();
    // Дата — только в браузере: на сервере она другая и сломала бы гидратацию.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStamp(
      `${now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}, ${now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`,
    );
  }, [state]);

  const params = paramRows(state, result);
  const groups = resultGroups(result, state, qualification);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 print:hidden">
        <button
          type="button"
          onClick={() => {
            trackEvent("partner_memo_print", { industry: state.industry, pkg: state.pkg, romi: Math.round(result.romiCore * 100) });
            window.print();
          }}
          className="rounded-full bg-[var(--sun)] px-6 py-3.5 font-bold text-[var(--on-accent)] transition hover:bg-[var(--sun-dark)] hover:text-white"
        >
          {memo.print}
        </button>
        <p className="max-w-md text-sm leading-5 text-[var(--muted)]">{memo.printHint}</p>
      </div>

      <article className="cd-memo mx-auto max-w-[820px] rounded-3xl border border-[var(--line)] bg-white p-6 text-[var(--ink)] shadow-[var(--shadow-card)] sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-[var(--sun)] pb-5">
          <p className="font-serif text-2xl font-bold tracking-wide">CHIMGAN DARBAZA RESORT</p>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sun-dark)]">Партнёрства и развитие</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{memo.orgLine} · chimgandarbaza.uz</p>
        </header>

        <h3 className="mt-6 font-serif text-3xl font-bold leading-tight">{memo.docTitle}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {memo.docSubtitle}
          {stamp && ` · сформировано ${stamp}`}
        </p>

        <section className="mt-6 break-inside-avoid">
          <h4 className="text-base font-bold">{memo.s1Title}</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-6">
            {memo.s1.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h4 className="text-base font-bold">{memo.s2Title}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6">
            {memo.s2.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h4 className="text-base font-bold">{memo.s3Title}</h4>
          <table className="mt-3 w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-left text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                <th className="py-2 pr-3 font-bold">Носитель</th>
                <th className="py-2 pr-3 font-bold">Окно</th>
                <th className="py-2 text-right font-bold">Цена, без НДС</th>
              </tr>
            </thead>
            <tbody>
              {priceBlock.rows.map((r) => (
                <tr key={r.pkg} className={`border-b border-[var(--line)] ${r.pkg === state.pkg ? "font-bold" : ""}`}>
                  <td className="py-1.5 pr-3">{r.title}{r.pkg === state.pkg ? " — выбран" : ""}</td>
                  <td className="py-1.5 pr-3">{PACKAGES[r.pkg].windowLabel}</td>
                  <td className="py-1.5 text-right">{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] leading-6">
            {memo.s3.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <section className="mt-6">
          <h4 className="text-base font-bold">{memo.s4Title}</h4>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--surface-warm)] p-4 sm:grid-cols-4 print:grid-cols-4">
            <div><p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">ROMI, основной</p><p className="text-xl font-bold">{fmtPct(result.romiCore)}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">Multiple</p><p className="text-xl font-bold">{fmtX(result.multiple)}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">Бюджет</p><p className="text-xl font-bold">{fmtSum(result.budget)}</p></div>
            <div><p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">CPHI</p><p className="text-xl font-bold">{result.cphi === null ? "—" : fmtSum(result.cphi)}</p></div>
          </div>
          {annualBonus && <p className="mt-2 text-[13px]">Годовой контракт: бонусный пакет на зиму 2027–2028 (права 0 сум) — в расчёт не входит.</p>}

          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 print:grid-cols-3 print:gap-x-5">
            <div className="break-inside-avoid">
              <p className="text-sm font-bold">Параметры расчёта</p>
              <table className="mt-1 w-full text-[13px]">
                <tbody>
                  {params.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--line)]">
                      <td className="py-1 pr-3 text-[var(--ink)]/75">{row.label}</td>
                      <td className="py-1 text-right font-semibold">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groups.map((g) => (
              <div key={g.title} className="break-inside-avoid">
                <p className="text-sm font-bold">{g.title}</p>
                <table className="mt-1 w-full text-[13px]">
                  <tbody>
                    {g.rows.map((row) => (
                      <tr key={row.label} className="border-b border-[var(--line)]">
                        <td className="py-1 pr-3 text-[var(--ink)]/75">{row.label}</td>
                        <td className={`py-1 text-right ${row.strong ? "font-bold" : "font-semibold"}`}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
            Формулы — раздел «Методология» на странице расчётов. ROMI = (Contribution − Бюджет) ÷ Бюджет; EMV показан справочно и в основной ROMI не входит.
          </p>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h4 className="text-base font-bold">{memo.s5Title}</h4>
          <p className="mt-2 text-[14px] leading-6">{memo.s5}</p>
        </section>

        <footer className="mt-8 border-t border-[var(--line)] pt-4 text-[12px] text-[var(--muted)]">{memo.footer}</footer>
      </article>
    </div>
  );
}
