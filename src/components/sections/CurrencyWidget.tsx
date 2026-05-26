"use client";

import { useEffect, useRef, useState } from "react";

type Rates = { usd_to_uzs: number; eur_to_uzs: number; rub_to_uzs: number };
type Currency = "USD" | "EUR" | "RUB" | "UZS";

const labels: Record<string, {
  title: string; sub: string; updated: string;
  usd: string; eur: string; rub: string; uzs: string;
  inputLabel: string; resultLabel: string;
}> = {
  ru: {
    title: "Курс валют",
    sub: "Актуальный курс к узбекскому суму",
    updated: "Обновляется ежедневно",
    usd: "Доллар США",
    eur: "Евро",
    rub: "Рос. рубль",
    uzs: "Узб. сум",
    inputLabel: "Введите сумму",
    resultLabel: "Получите",
  },
  uz: {
    title: "Valyuta kursi",
    sub: "O'zbek so'miga nisbatan joriy kurs",
    updated: "Har kuni yangilanadi",
    usd: "AQSH dollari",
    eur: "Evro",
    rub: "Rossiya rubli",
    uzs: "O'zbek so'mi",
    inputLabel: "Miqdorni kiriting",
    resultLabel: "Olasiz",
  },
  en: {
    title: "Exchange rates",
    sub: "Current rates to Uzbek Som",
    updated: "Updated daily",
    usd: "US Dollar",
    eur: "Euro",
    rub: "Russian Ruble",
    uzs: "Uzbek Som",
    inputLabel: "Enter amount",
    resultLabel: "You get",
  },
};

function fmt(n: number, dec = 0) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: dec });
}

const CURRENCY_META: Record<Currency, { flag: string; code: string }> = {
  USD: { flag: "🇺🇸", code: "USD" },
  EUR: { flag: "🇪🇺", code: "EUR" },
  RUB: { flag: "🇷🇺", code: "RUB" },
  UZS: { flag: "🇺🇿", code: "UZS" },
};

const CURRENCY_KEYS: Currency[] = ["USD", "EUR", "RUB", "UZS"];

export function CurrencyWidget({ locale }: { locale: string }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [input, setInput] = useState("");
  const [base, setBase] = useState<Currency>("USD");
  const [target, setTarget] = useState<Currency>("UZS");
  const [openDropdown, setOpenDropdown] = useState<"base" | "target" | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")
      .then((r) => r.json())
      .then((d) => {
        const usdUzs = d.usd.uzs as number;
        setRates({
          usd_to_uzs: usdUzs,
          eur_to_uzs: usdUzs / (d.usd.eur as number),
          rub_to_uzs: usdUzs / (d.usd.rub as number),
        });
      })
      .catch(() => {});
  }, []);

  // Outside click closes any open dropdown
  useEffect(() => {
    if (!openDropdown) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openDropdown]);

  const l = labels[locale] ?? labels.ru;

  // Rate of 1 unit of currency to UZS
  function rateToUzs(cur: Currency): number {
    if (!rates) return 1;
    if (cur === "UZS") return 1;
    if (cur === "USD") return rates.usd_to_uzs;
    if (cur === "EUR") return rates.eur_to_uzs;
    return rates.rub_to_uzs;
  }

  function convert(value: number, from: Currency, to: Currency): number {
    if (!rates || from === to) return value;
    // Convert via UZS
    return (value * rateToUzs(from)) / rateToUzs(to);
  }

  const amount = parseFloat(input) || 0;
  const converted = convert(amount, base, target);
  // For result formatting: more decimals if target is non-UZS (small numbers)
  const resultDecimals = target === "UZS" ? 0 : 2;

  function swap() {
    setBase(target);
    setTarget(base);
  }

  // Rate cards still show USD/EUR/RUB → UZS (informational header strip)
  const rateCards = [
    { key: "USD" as const, rate: rates?.usd_to_uzs, flag: "🇺🇸" },
    { key: "EUR" as const, rate: rates?.eur_to_uzs, flag: "🇪🇺" },
    { key: "RUB" as const, rate: rates?.rub_to_uzs, flag: "🇷🇺" },
  ];

  return (
    <div className="relative rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      {/* Header — editorial, soft cream */}
      <div className="rounded-t-2xl border-b border-[color:var(--line)] bg-[var(--surface-warm)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{l.sub}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[var(--ink)]">{l.title}</p>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--forest)]/20 bg-[var(--forest)]/8 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--forest)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--forest-dark)]">Live</span>
          </div>
        </div>
      </div>

      <div ref={wrapperRef} className="space-y-4 p-6">
        {/* Rate cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {rateCards.map((c) => (
            <div
              key={c.key}
              className="group rounded-xl border border-[color:var(--line)] bg-[var(--surface-warm)] px-3 py-3 text-center transition-all hover:border-[var(--forest)]/40 hover:shadow-sm"
            >
              <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                <span className="text-sm leading-none">{c.flag}</span>
                <span>1 {c.key}</span>
              </p>
              {rates ? (
                <p className="mt-1.5 font-serif text-xl font-bold leading-none text-[var(--ink)]">
                  {fmt(c.rate ?? 0)}
                </p>
              ) : (
                <div className="mx-auto mt-1.5 h-5 w-16 animate-pulse rounded bg-[var(--mist)]" />
              )}
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">UZS</p>
            </div>
          ))}
        </div>

        {/* Bi-directional converter */}
        <div className="space-y-2">
          {/* FROM row */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              {l.inputLabel}
            </label>
            <div className="relative">
              <div className="flex overflow-hidden rounded-xl border border-[color:var(--line)] bg-[var(--surface-warm)] focus-within:border-[var(--forest)]/50 focus-within:bg-[var(--paper)] focus-within:shadow-sm transition-all">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base font-bold text-[var(--ink)] placeholder-[var(--muted)]/50 focus:outline-none"
                />
                <CurrencyDropdownTrigger
                  value={base}
                  isOpen={openDropdown === "base"}
                  onClick={() => setOpenDropdown((o) => (o === "base" ? null : "base"))}
                />
              </div>
              {openDropdown === "base" && (
                <CurrencyDropdownList
                  active={base}
                  disabled={target}
                  onSelect={(c) => { setBase(c); setOpenDropdown(null); }}
                />
              )}
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap currencies"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-[var(--paper)] shadow-sm transition-all hover:rotate-180 hover:border-[var(--forest)]/50 hover:bg-[var(--forest)]/8"
            >
              <svg className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--forest-dark)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16m0 0l-4-4m4 4l4-4M17 20V4m0 0l-4 4m4-4l4 4" />
              </svg>
            </button>
          </div>

          {/* TO row — forest accent (result) */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[var(--forest-dark)]">
              {l.resultLabel}
            </label>
            <div className="relative">
              <div className="flex overflow-hidden rounded-xl border border-[var(--forest)]/30 bg-[var(--forest)]/8 transition-all">
                <div className="min-w-0 flex-1 px-4 py-3.5">
                  {rates ? (
                    <p className="font-serif text-lg font-bold leading-tight text-[var(--forest-dark)] truncate">
                      {amount > 0 ? fmt(converted, resultDecimals) : "0"}
                    </p>
                  ) : (
                    <div className="h-5 w-24 animate-pulse rounded bg-[var(--forest)]/15" />
                  )}
                </div>
                <CurrencyDropdownTrigger
                  value={target}
                  isOpen={openDropdown === "target"}
                  onClick={() => setOpenDropdown((o) => (o === "target" ? null : "target"))}
                  variant="forest"
                />
              </div>
              {openDropdown === "target" && (
                <CurrencyDropdownList
                  active={target}
                  disabled={base}
                  onSelect={(c) => { setTarget(c); setOpenDropdown(null); }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-end gap-1.5 border-t border-[color:var(--line)] pt-3">
          <svg className="h-3 w-3 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">{l.updated}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────

function CurrencyDropdownTrigger({
  value,
  isOpen,
  onClick,
  variant = "default",
}: {
  value: Currency;
  isOpen: boolean;
  onClick: () => void;
  variant?: "default" | "forest";
}) {
  const isForest = variant === "forest";
  const baseClasses = isForest
    ? "border-[var(--forest)]/30 text-[var(--forest-dark)] hover:bg-[var(--forest)]/15"
    : "border-[color:var(--line)] text-[var(--ink)] hover:bg-[var(--paper)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      className={`flex shrink-0 items-center gap-2 border-l px-4 py-3.5 text-sm font-bold transition-colors ${baseClasses}`}
    >
      <span className="text-base leading-none">{CURRENCY_META[value].flag}</span>
      <span>{CURRENCY_META[value].code}</span>
      <svg
        className={`h-3 w-3 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4.5l3 3 3-3" />
      </svg>
    </button>
  );
}

function CurrencyDropdownList({
  active,
  disabled,
  onSelect,
}: {
  active: Currency;
  disabled: Currency;
  onSelect: (c: Currency) => void;
}) {
  return (
    <ul
      role="listbox"
      className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card-hover)]"
    >
      {CURRENCY_KEYS.map((key) => {
        const isActive = key === active;
        const isDisabled = key === disabled;
        return (
          <li key={key}>
            <button
              type="button"
              role="option"
              aria-selected={isActive}
              disabled={isDisabled}
              onClick={() => onSelect(key)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[var(--forest)] text-white"
                  : isDisabled
                    ? "text-[var(--muted)]/40 cursor-not-allowed"
                    : "text-[var(--ink)] hover:bg-[var(--surface-warm)]"
              }`}
            >
              <span className="text-base leading-none">{CURRENCY_META[key].flag}</span>
              <span>{CURRENCY_META[key].code}</span>
              {isActive && (
                <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isDisabled && (
                <span className="ml-auto text-[9px] font-normal opacity-60">↑</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
