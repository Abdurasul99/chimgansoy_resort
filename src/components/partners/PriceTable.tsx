"use client";

import { priceBlock } from "@/content/partners-b2b";
import { useWorkbench } from "./Workbench";

/** Прайс: строки из контента, цены из модели; «Рассчитать» включает пакет в калькулятор. */
export function PriceTable() {
  const { state, setPackage } = useWorkbench();

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)]">
      {/* Таблица на широком экране */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-[var(--surface-warm)] text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold">Носитель</th>
            <th scope="col" className="px-4 py-4 font-bold">Зоны</th>
            <th scope="col" className="px-4 py-4 font-bold">Окно работы</th>
            <th scope="col" className="px-4 py-4 text-right font-bold">Цена, без НДС</th>
            <th scope="col" className="px-6 py-4"><span className="sr-only">Действие</span></th>
          </tr>
        </thead>
        <tbody>
          {priceBlock.rows.map((r) => {
            const active = state.pkg === r.pkg;
            return (
              <tr key={r.pkg} className={`border-t border-[var(--line)] ${active ? "bg-[var(--sun)]/[0.07]" : ""}`}>
                <td className="px-6 py-4 align-top">
                  <p className="font-bold text-[var(--ink)]">{r.title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted)]">{r.what}</p>
                </td>
                <td className="px-4 py-4 align-top text-[var(--ink)]/80">{r.zones}</td>
                <td className="px-4 py-4 align-top text-[var(--ink)]/80">{priceBlock.windowLabel(r.pkg)}</td>
                <td className="px-4 py-4 text-right align-top">
                  <p className="whitespace-nowrap font-bold text-[var(--ink)]">{r.price}</p>
                  {r.note && <p className="mt-0.5 text-[12px] leading-4 text-[var(--muted)]">{r.note}</p>}
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => setPackage(r.pkg, { scroll: true, source: "price" })}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                      active ? "bg-[var(--sun)] text-[var(--on-accent)]" : "border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)] hover:bg-[var(--sun)]/10"
                    }`}
                  >
                    {active ? "В расчёте" : priceBlock.cta} →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Карточки на телефоне */}
      <ul className="divide-y divide-[var(--line)] md:hidden">
        {priceBlock.rows.map((r) => {
          const active = state.pkg === r.pkg;
          return (
            <li key={r.pkg} className={`p-5 ${active ? "bg-[var(--sun)]/[0.07]" : ""}`}>
              <p className="font-bold text-[var(--ink)]">{r.title}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted)]">{r.what}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{r.zones} · {priceBlock.windowLabel(r.pkg)}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-bold text-[var(--ink)]">{r.price}</p>
                  {r.note && <p className="text-[12px] text-[var(--muted)]">{r.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setPackage(r.pkg, { scroll: true, source: "price" })}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-[var(--sun)] text-[var(--on-accent)]" : "border border-[var(--line-strong)] text-[var(--ink)]"}`}
                >
                  {active ? "В расчёте" : priceBlock.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
