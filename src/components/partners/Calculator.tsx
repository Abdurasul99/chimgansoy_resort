"use client";

import { useId } from "react";
import {
  ATTENTION,
  BUDGET,
  INDUSTRIES,
  INDUSTRY_KEYS,
  PACKAGES,
  PACKAGE_KEYS,
  PROJECT_RIGHTS,
  QADAM,
  TRAFFIC,
  UGC,
  type IndustryKey,
  type PackageKey,
  type QadamStep,
} from "@/lib/partners/economics";
import { fmtInt, fmtNum, fmtPct, fmtSum, fmtX } from "@/lib/partners/format";
import { trackEvent } from "@/lib/analytics";
import { useWorkbench } from "./Workbench";
import { resultGroups } from "./rows";

const field = "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const labelCls = "text-sm font-semibold text-[var(--ink)]";

function Range(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const fill = ((props.value - props.min) / (props.max - props.min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelCls}>{props.label}</label>
        <output htmlFor={id} className="shrink-0 font-bold tabular-nums text-[var(--sun-dark)]">{props.display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="cd-range mt-2 w-full"
        style={{ "--fill": `${Math.min(100, Math.max(0, fill))}%` } as React.CSSProperties}
      />
      {props.hint && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{props.hint}</p>}
    </div>
  );
}

function NumberField(props: { label: string; value: number | null; onChange: (v: number | null) => void; suffix: string; step?: number; hint?: string; placeholder?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{props.label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={props.step ?? 1}
          value={props.value ?? ""}
          placeholder={props.placeholder}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            props.onChange(v !== null && Number.isFinite(v) && v >= 0 ? v : null);
          }}
          className={`${field} pr-24`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-[var(--muted)]">{props.suffix}</span>
      </div>
      {props.hint && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{props.hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="space-y-5 border-t border-[var(--line)] pt-5 first:border-t-0 first:pt-0">
      <h4 id={id} className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</h4>
      {children}
    </div>
  );
}

export function Calculator() {
  const { state: s, result: r, qualification: q, annualBonus, set, setIndustry, setPackage, reset, notify } = useWorkbench();
  const ind = INDUSTRIES[s.industry];
  const pkg = PACKAGES[s.pkg];
  const groups = resultGroups(r, s, q);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <style>{`
        .cd-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(to right, var(--sun) var(--fill), var(--mist) var(--fill)); outline: none; }
        .cd-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 2px solid var(--sun-dark); box-shadow: 0 2px 6px rgba(31,42,51,.18); cursor: pointer; }
        .cd-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid var(--sun-dark); cursor: pointer; }
        .cd-range:focus-visible { box-shadow: 0 0 0 3px rgba(244,165,42,.35); }
      `}</style>

      {/* ── Параметры ── */}
      <div className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
        <h3 className="font-serif text-2xl font-bold text-[var(--ink)]">Параметры</h3>
        <div className="mt-5 space-y-6">
          <Panel title="Сценарий">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Отрасль</span>
                <select value={s.industry} onChange={(e) => setIndustry(e.target.value as IndustryKey)} className={`${field} mt-1.5`}>
                  {INDUSTRY_KEYS.map((k) => (
                    <option key={k} value={k}>{INDUSTRIES[k].label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Пакет</span>
                <select value={s.pkg} onChange={(e) => setPackage(e.target.value as PackageKey, { source: "calculator" })} className={`${field} mt-1.5`}>
                  {PACKAGE_KEYS.map((k) => (
                    <option key={k} value={k}>{PACKAGES[k].label}</option>
                  ))}
                </select>
              </label>
            </div>
            {s.pkg === "project" && (
              <Range
                label="Цена прав проекта"
                value={s.projectRights}
                min={PROJECT_RIGHTS.min}
                max={PROJECT_RIGHTS.max}
                step={PROJECT_RIGHTS.step}
                display={fmtSum(s.projectRights)}
                onChange={(v) => set({ projectRights: v })}
              />
            )}
            {pkg.nonExclusive && (
              <Range
                label="Доля голоса бренда (SOV)"
                value={Math.round(s.sov * 100)}
                min={10}
                max={100}
                step={5}
                display={fmtPct(s.sov)}
                hint="Платёжный контур неэксклюзивный: охват делится между брендами."
                onChange={(v) => set({ sov: v / 100 })}
              />
            )}
          </Panel>

          <Panel title="Воронка и ценность клиента">
            <Range label="Доля контакта с зоной" value={Math.round(s.contactShare * 100)} min={5} max={100} step={1} display={fmtPct(s.contactShare)} hint="Какая часть гостей окна входит в зону носителя. По умолчанию — значение пакета." onChange={(v) => set({ contactShare: v / 100 })} />
            <Range label="Вовлечение ER" value={Math.round(s.er * 1000) / 10} min={1} max={60} step={0.5} display={fmtPct(s.er, 1)} onChange={(v) => set({ er: v / 100 })} />
            <Range label="Конверсия CR" value={Math.round(s.cr * 1000) / 10} min={0.1} max={15} step={0.1} display={fmtPct(s.cr, 1)} hint="Доля вовлечённых, совершивших целевое действие." onChange={(v) => set({ cr: v / 100 })} />
            {ind.kind === "household" ? (
              <>
                <NumberField label="ARPU абонента" value={s.arpu} suffix="сум/мес" step={1000} onChange={(v) => set({ arpu: v ?? 0 })} />
                <Range label="Размер семьи" value={s.household} min={1} max={6} step={0.1} display={`${fmtNum(s.household)} чел.`} hint={`LTV домохозяйства = ARPU × 24 мес × семья = ${fmtSum(r.ltvUnit)}. На число подключений семья не умножается.`} onChange={(v) => set({ household: v })} />
              </>
            ) : (
              <NumberField label="LTV клиента за 3 года" value={Math.round(s.ltvUnit / 1e5) / 10} suffix="млн сум" step={0.1} onChange={(v) => set({ ltvUnit: (v ?? 0) * 1e6 })} />
            )}
            <Range label="Маржа" value={Math.round(s.margin * 100)} min={1} max={100} step={1} display={fmtPct(s.margin)} onChange={(v) => set({ margin: v / 100 })} />
          </Panel>

          <Panel title="Бюджет">
            <Range label="BTL — печать, монтаж, промо" value={Math.round(s.btlCoef * 100)} min={BUDGET.btl.min * 100} max={BUDGET.btl.max * 100} step={1} display={fmtPct(s.btlCoef)} hint="Доля от цены прав; работы выполняет партнёр." onChange={(v) => set({ btlCoef: v / 100 })} />
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={s.vatRecoverable} onChange={(e) => set({ vatRecoverable: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--sun-dark)]" />
              <span className="text-sm leading-5 text-[var(--ink)]">
                Партнёр возмещает НДС
                <span className="block text-xs text-[var(--muted)]">Тогда метрики считаются от бюджета без НДС. По умолчанию выключено — консервативно.</span>
              </span>
            </label>
          </Panel>

          <Panel title="Квалификация">
            {s.industry === "bank" ? (
              <NumberField label="Чистая прибыль банка за год" value={s.bankProfitBn} suffix="млрд сум" step={1} placeholder="не указана" hint="Банки квалифицируются по чистой прибыли, не по 7 Qadam. В ROMI не входит." onChange={(v) => set({ bankProfitBn: v && v > 0 ? v : null })} />
            ) : (
              <>
                <Range label="Масштаб компании (7 Qadam)" value={s.qadamStep} min={3} max={7} step={1} display={`Ступень ${s.qadamStep}`} hint={`Оборот ${QADAM[s.qadamStep].turnover}, маркетинг от $${fmtInt(QADAM[s.qadamStep].budgetUsd[0])} в год. В ROMI не входит.`} onChange={(v) => set({ qadamStep: v as QadamStep })} />
                <NumberField label="Курс USD/UZS" value={s.fx} suffix="сум за $1" step={1} onChange={(v) => set({ fx: v && v > 0 ? v : s.fx })} />
              </>
            )}
          </Panel>

          <details className="group border-t border-[var(--line)] pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Трафик, внимание и UGC
              <span aria-hidden className="text-lg transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-5 space-y-5">
              <Range label="Гостей в год" value={s.guestsYear} min={TRAFFIC.guestsYear.min} max={TRAFFIC.guestsYear.max} step={TRAFFIC.guestsYear.step} display={fmtInt(s.guestsYear)} hint="Оценка курорта: 200–250 тыс. По умолчанию — нижняя граница." onChange={(v) => set({ guestsYear: v })} />
              <Range label="Время визита" value={s.visitHours} min={TRAFFIC.visitHours.min} max={TRAFFIC.visitHours.max} step={TRAFFIC.visitHours.step} display={`${fmtNum(s.visitHours)} ч`} hint="Оценка курорта: 5,5–7 часов. Влияет только на часы погружения и CPHI." onChange={(v) => set({ visitHours: Math.round(v * 10) / 10 })} />
              <Range label="Экспозиция" value={Math.round(s.exposure * 100)} min={ATTENTION.exposure.min * 100} max={100} step={1} display={fmtPct(s.exposure)} hint="Доля визита в поле бренда. Меняет часы и CPHI, но не число людей." onChange={(v) => set({ exposure: v / 100 })} />
              <Range label="Доля вовлечённых, публикующих UGC" value={Math.round(s.postingRate * 1000) / 10} min={UGC.postingRate.min * 100} max={UGC.postingRate.max * 100} step={0.5} display={fmtPct(s.postingRate, 1)} onChange={(v) => set({ postingRate: v / 100 })} />
              <Range label="Показов на одну публикацию" value={s.avgPostReach} min={UGC.avgPostReach.min} max={UGC.avgPostReach.max} step={UGC.avgPostReach.step} display={fmtInt(s.avgPostReach)} onChange={(v) => set({ avgPostReach: v })} />
            </div>
          </details>

          <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
            <button type="button" onClick={reset} className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)]">
              Сбросить к значениям отрасли
            </button>
          </div>
        </div>
      </div>

      {/* ── Результаты ── */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-[var(--ink)] p-6 text-white shadow-[var(--shadow-card-hover)] sm:p-7">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            <span>{ind.label}</span>
            <span aria-hidden>·</span>
            <span>{pkg.label}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/55">ROMI · основной</p>
              <p className={`mt-1 font-serif text-5xl font-bold tabular-nums ${r.romiCore >= 0 ? "text-[var(--sun)]" : "text-white"}`}>{fmtPct(r.romiCore)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/55">Multiple · покрытие LTV</p>
              <p className="mt-1 font-serif text-5xl font-bold tabular-nums">{fmtX(r.multiple)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/55">Бюджет {s.vatRecoverable ? "без НДС" : "с НДС"}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{fmtSum(r.budget)}</p>
              <p className="text-xs text-white/50">{pkg.period === "сезон" ? "за сезон" : pkg.period === "год" ? "за год" : "за проект"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/55">CPHI · час погружения</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{r.cphi === null ? "—" : fmtSum(r.cphi)}</p>
              <p className="text-xs text-white/50">выгода к DOOH {fmtX(r.advantage, 1)}</p>
            </div>
          </div>
          {annualBonus && (
            <p className="mt-5 rounded-2xl bg-white/10 p-3 text-sm leading-5 text-white/85">
              Годовой контракт: бонусный пакет на зиму 2027–2028 (права 0 сум). В расчёт окупаемости не входит.
            </p>
          )}
          <a
            href="#memorandum"
            onClick={() => {
              trackEvent("partner_to_memo", { industry: s.industry, pkg: s.pkg });
              notify("Расчёт — в разделе IV меморандума");
            }}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--sun)] px-6 py-3.5 font-bold text-[var(--on-accent)] transition hover:bg-[var(--sun-dark)] hover:text-white"
          >
            Расчёт в меморандум →
          </a>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <section key={g.title} className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{g.title}</h4>
              <dl className="mt-3 space-y-2">
                {g.rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="text-[var(--ink)]/75">
                      {row.label}
                      {row.hint && <span className="block text-[11px] text-[var(--muted)]">{row.hint}</span>}
                    </dt>
                    <dd className={`shrink-0 text-right tabular-nums ${row.strong ? "font-bold text-[var(--ink)]" : "font-semibold text-[var(--ink)]/90"}`}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
