"use client";

import { useEffect, useRef, useState } from "react";

type Rates = { usd_to_uzs: number; eur_to_uzs: number; rub_to_uzs: number };

const labels: Record<string, {
  title: string; sub: string; updated: string;
  usd: string; eur: string; rub: string;
  inputLabel: string; resultLabel: string;
}> = {
  ru: {
    title: "Курс валют",
    sub: "Актуальный курс к узбекскому суму",
    updated: "Обновляется ежедневно",
    usd: "Доллар США",
    eur: "Евро",
    rub: "Рос. рубль",
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
    inputLabel: "Enter amount",
    resultLabel: "You get",
  },
};

function fmt(n: number, dec = 0) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: dec });
}

const CURRENCY_META = {
  USD: { flag: "🇺🇸", code: "USD" },
  EUR: { flag: "🇪🇺", code: "EUR" },
  RUB: { flag: "🇷🇺", code: "RUB" },
} as const;

export function CurrencyWidget({ locale }: { locale: string }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [input, setInput] = useState("");
  const [base, setBase] = useState<"USD" | "EUR" | "RUB">("USD");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropOpen]);

  const l = labels[locale] ?? labels.ru;
  const amount = parseFloat(input) || 0;

  function toUzs(cur: "USD" | "EUR" | "RUB", val: number) {
    if (!rates) return 0;
    const r = cur === "USD" ? rates.usd_to_uzs : cur === "EUR" ? rates.eur_to_uzs : rates.rub_to_uzs;
    return val * r;
  }

  const currencies = [
    { key: "USD" as const, label: l.usd, rate: rates?.usd_to_uzs, flag: "🇺🇸" },
    { key: "EUR" as const, label: l.eur, rate: rates?.eur_to_uzs, flag: "🇪🇺" },
    { key: "RUB" as const, label: l.rub, rate: rates?.rub_to_uzs, flag: "🇷🇺" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      {/* Header — editorial, soft cream */}
      <div className="border-b border-[color:var(--line)] bg-[var(--surface-warm)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{l.sub}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[var(--ink)]">{l.title}</p>
          </div>
          {/* Live dot */}
          <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--forest)]/20 bg-[var(--forest)]/8 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--forest)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--forest-dark)]">Live</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Rate cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {currencies.map((c) => (
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

        {/* Converter */}
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            {l.inputLabel}
          </label>

          {/* Wrapper: relative for dropdown anchor + ref for outside-click — NO overflow-hidden */}
          <div ref={dropRef} className="relative">
            {/* Input row: overflow-hidden lives on this inner container only */}
            <div className="flex overflow-hidden rounded-xl border border-[color:var(--line)] bg-[var(--surface-warm)] focus-within:border-[var(--forest)]/50 focus-within:bg-[var(--paper)] focus-within:shadow-sm transition-all">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base font-bold text-[var(--ink)] placeholder-[var(--muted)]/50 focus:outline-none"
              />

              {/* Currency dropdown trigger */}
              <button
                type="button"
                onClick={() => setDropOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={dropOpen}
                className="flex shrink-0 items-center gap-2 border-l border-[color:var(--line)] px-4 py-3.5 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
              >
                <span className="text-base leading-none">{CURRENCY_META[base].flag}</span>
                <span>{CURRENCY_META[base].code}</span>
                <svg
                  className={`h-3 w-3 text-[var(--muted)] transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`}
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
            </div>

            {/* Dropdown list — rendered outside overflow-hidden so it isn't clipped */}
            {dropOpen && (
              <ul
                role="listbox"
                className="absolute right-0 top-[calc(100%+6px)] z-30 w-40 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card-hover)]"
              >
                {(Object.keys(CURRENCY_META) as Array<keyof typeof CURRENCY_META>).map((key) => {
                  const isActive = key === base;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => { setBase(key); setDropOpen(false); }}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-[var(--forest)] text-white"
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
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Result */}
          {amount > 0 && rates && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--forest)]/25 bg-[var(--forest)]/8 px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--forest-dark)]">{l.resultLabel}</span>
              <p className="text-right font-serif text-xl font-bold text-[var(--forest-dark)]">
                {fmt(toUzs(base, amount))}
                <span className="ml-1 text-xs font-semibold uppercase tracking-widest text-[var(--forest)]/70">UZS</span>
              </p>
            </div>
          )}
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
