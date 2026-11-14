"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENTION,
  BUDGET,
  FX_DEFAULT,
  INDUSTRIES,
  PACKAGES,
  PROJECT_RIGHTS,
  TRAFFIC,
  UGC,
  computeModel,
  isPackageKey,
  normalizeIndustry,
  qualify,
  type IndustryKey,
  type ModelResult,
  type PackageKey,
  type QadamStep,
  type Qualification,
} from "@/lib/partners/economics";
import { trackEvent } from "@/lib/analytics";

/**
 * Состояние рабочей панели партнёра — одно на карту, прайс, калькулятор,
 * меморандум и заявку. Порядок приоритета при открытии: параметры адреса
 * (?industry=…&pkg=…&bonus=annual — так ведёт лендинг) → сохранённый расчёт
 * этого браузера → значения отрасли по умолчанию. Расчёт сохраняется при
 * каждой правке: партнёр вернётся и продолжит с того же места.
 */

export type CalcState = {
  industry: IndustryKey;
  pkg: PackageKey;
  guestsYear: number;
  visitHours: number;
  contactShare: number;
  sov: number;
  er: number;
  cr: number;
  ltvUnit: number;
  arpu: number;
  household: number;
  margin: number;
  exposure: number;
  btlCoef: number;
  vatRecoverable: boolean;
  projectRights: number;
  postingRate: number;
  avgPostReach: number;
  qadamStep: QadamStep;
  fx: number;
  /** Чистая прибыль банка, млрд сум в год; null — не указана. */
  bankProfitBn: number | null;
};

const STORAGE_KEY = "cd_partner_calc_v2";

function industryDefaults(industry: IndustryKey) {
  const ind = INDUSTRIES[industry];
  return {
    er: ind.er,
    cr: ind.cr,
    margin: ind.margin,
    ltvUnit: ind.kind === "ltv" ? ind.ltv : 0,
    arpu: ind.kind === "household" ? ind.arpu : 0,
    household: ind.kind === "household" ? ind.household : 4.2,
  };
}

export function defaultState(industry: IndustryKey = "bank", pkg: PackageKey = "title"): CalcState {
  return {
    industry,
    pkg,
    guestsYear: TRAFFIC.guestsYear.default,
    visitHours: TRAFFIC.visitHours.default,
    contactShare: PACKAGES[pkg].contactShare,
    sov: 1,
    ...industryDefaults(industry),
    exposure: ATTENTION.exposure.default,
    btlCoef: BUDGET.btl.default,
    vatRecoverable: false,
    projectRights: PROJECT_RIGHTS.default,
    postingRate: UGC.postingRate.default,
    avgPostReach: UGC.avgPostReach.default,
    qadamStep: 5,
    fx: FX_DEFAULT,
    bankProfitBn: null,
  };
}

const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/** Сохранённое состояние приходит из чужого браузера — проверяем каждое поле. */
function sanitize(raw: unknown): CalcState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const industry = normalizeIndustry(typeof o.industry === "string" ? o.industry : null);
  const pkg = typeof o.pkg === "string" && isPackageKey(o.pkg) ? o.pkg : null;
  if (!industry || !pkg) return null;
  const d = defaultState(industry, pkg);
  const step = clamp(o.qadamStep, 3, 7, 5);
  return {
    industry,
    pkg,
    guestsYear: clamp(o.guestsYear, TRAFFIC.guestsYear.min, TRAFFIC.guestsYear.max, d.guestsYear),
    visitHours: clamp(o.visitHours, TRAFFIC.visitHours.min, TRAFFIC.visitHours.max, d.visitHours),
    contactShare: clamp(o.contactShare, 0.05, 1, d.contactShare),
    sov: clamp(o.sov, 0.1, 1, d.sov),
    er: clamp(o.er, 0.01, 0.6, d.er),
    cr: clamp(o.cr, 0.001, 0.15, d.cr),
    ltvUnit: clamp(o.ltvUnit, 0, 1e10, d.ltvUnit),
    arpu: clamp(o.arpu, 0, 1e7, d.arpu),
    household: clamp(o.household, 1, 6, d.household),
    margin: clamp(o.margin, 0.01, 1, d.margin),
    exposure: clamp(o.exposure, ATTENTION.exposure.min, ATTENTION.exposure.max, d.exposure),
    btlCoef: clamp(o.btlCoef, BUDGET.btl.min, BUDGET.btl.max, d.btlCoef),
    vatRecoverable: o.vatRecoverable === true,
    projectRights: clamp(o.projectRights, PROJECT_RIGHTS.min, PROJECT_RIGHTS.max, d.projectRights),
    postingRate: clamp(o.postingRate, UGC.postingRate.min, UGC.postingRate.max, d.postingRate),
    avgPostReach: clamp(o.avgPostReach, UGC.avgPostReach.min, UGC.avgPostReach.max, d.avgPostReach),
    qadamStep: Math.round(step) as QadamStep,
    fx: clamp(o.fx, 1000, 100_000, d.fx),
    bankProfitBn: typeof o.bankProfitBn === "number" && o.bankProfitBn > 0 ? Math.min(o.bankProfitBn, 1e6) : null,
  };
}

export function toModelInput(s: CalcState) {
  return {
    pkg: s.pkg,
    industry: s.industry,
    guestsYear: s.guestsYear,
    visitHours: s.visitHours,
    contactShare: s.contactShare,
    sov: s.sov,
    er: s.er,
    cr: s.cr,
    ltvUnit: s.ltvUnit,
    arpu: s.arpu,
    household: s.household,
    margin: s.margin,
    exposure: s.exposure,
    btlCoef: s.btlCoef,
    vatRecoverable: s.vatRecoverable,
    rightsOverride: s.pkg === "project" ? s.projectRights : undefined,
    postingRate: s.postingRate,
    avgPostReach: s.avgPostReach,
  };
}

type WorkbenchValue = {
  state: CalcState;
  result: ModelResult;
  qualification: Qualification;
  annualBonus: boolean;
  set: (patch: Partial<CalcState>) => void;
  setIndustry: (industry: IndustryKey) => void;
  setPackage: (pkg: PackageKey, opts?: { scroll?: boolean; source?: string }) => void;
  reset: () => void;
  toast: string | null;
  notify: (message: string) => void;
};

const Ctx = createContext<WorkbenchValue | null>(null);

export function useWorkbench(): WorkbenchValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkbench вне <Workbench>");
  return v;
}

export function Workbench({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalcState>(() => defaultState());
  const [annualBonus, setAnnualBonus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ready = useRef(false);
  const touched = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Открытие: адрес → сохранённый расчёт → значения по умолчанию.
  useEffect(() => {
    let saved: CalcState | null = null;
    try {
      saved = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
    } catch {
      saved = null;
    }
    const qs = new URLSearchParams(window.location.search);
    const urlIndustry = normalizeIndustry(qs.get("industry"));
    const urlPkg = qs.get("pkg");
    let next = saved ?? defaultState();
    if (urlIndustry && urlIndustry !== next.industry) next = { ...next, industry: urlIndustry, ...industryDefaults(urlIndustry) };
    if (isPackageKey(urlPkg) && urlPkg !== next.pkg) next = { ...next, pkg: urlPkg, contactShare: PACKAGES[urlPkg].contactShare };
    // Состояние из адреса и хранилища известно только в браузере, поэтому
    // применяется после монтирования, а не в начальном useState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(next);
    setAnnualBonus(qs.get("bonus") === "annual");
    if (saved) trackEvent("partner_calc_restored", { industry: next.industry, pkg: next.pkg });
    trackEvent("partner_detail_open", { industry: urlIndustry ?? null, pkg: isPackageKey(urlPkg) ? urlPkg : null });
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* хранилище недоступно — расчёт просто не переживёт перезагрузку */
    }
  }, [state]);

  const markTouched = useCallback((s: CalcState) => {
    if (touched.current) return;
    touched.current = true;
    trackEvent("partner_calc_used", { industry: s.industry, pkg: s.pkg });
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const set = useCallback(
    (patch: Partial<CalcState>) =>
      setState((s) => {
        const next = { ...s, ...patch };
        markTouched(next);
        return next;
      }),
    [markTouched],
  );

  const setIndustry = useCallback(
    (industry: IndustryKey) =>
      setState((s) => {
        const next = { ...s, industry, ...industryDefaults(industry) };
        markTouched(next);
        return next;
      }),
    [markTouched],
  );

  const setPackage = useCallback(
    (pkg: PackageKey, opts: { scroll?: boolean; source?: string } = {}) => {
      setState((s) => {
        const next = { ...s, pkg, contactShare: PACKAGES[pkg].contactShare };
        markTouched(next);
        return next;
      });
      if (opts.source) trackEvent("partner_zone_selected", { pkg, source: opts.source });
      if (opts.scroll) {
        document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
        notify(`«${PACKAGES[pkg].label}» — в расчёте`);
      }
    },
    [markTouched, notify],
  );

  const reset = useCallback(() => {
    setState((s) => defaultState(s.industry, s.pkg));
    notify("Параметры сброшены к значениям отрасли");
  }, [notify]);

  const result = useMemo(() => computeModel(toModelInput(state)), [state]);
  const qualification = useMemo(
    () =>
      qualify({
        industry: state.industry,
        budget: result.budget,
        qadamStep: state.qadamStep,
        fx: state.fx,
        bankNetProfit: state.bankProfitBn ? state.bankProfitBn * 1e9 : null,
      }),
    [state.industry, state.qadamStep, state.fx, state.bankProfitBn, result.budget],
  );

  const value = useMemo(
    () => ({ state, result, qualification, annualBonus, set, setIndustry, setPackage, reset, toast, notify }),
    [state, result, qualification, annualBonus, set, setIndustry, setPackage, reset, toast, notify],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-float)] transition-all duration-300 print:hidden ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast}
      </div>
    </Ctx.Provider>
  );
}
