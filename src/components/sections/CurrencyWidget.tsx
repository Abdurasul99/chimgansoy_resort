"use client";

import { useEffect, useState } from "react";

type Rates = { usd_to_uzs: number; eur_to_uzs: number; rub_to_uzs: number };

const labels: Record<string, {
  title: string; sub: string; updated: string;
  usd: string; eur: string; rub: string;
  inputLabel: string;
}> = {
  ru: {
    title: "Курс валют",
    sub: "Актуальный курс к узбекскому суму",
    updated: "Данные обновляются ежедневно",
    usd: "Доллар США",
    eur: "Евро",
    rub: "Рос. рубль",
    inputLabel: "Введите сумму",
  },
  uz: {
    title: "Valyuta kursi",
    sub: "O'zbek so'miga nisbatan joriy kurs",
    updated: "Ma'lumotlar har kuni yangilanadi",
    usd: "AQSH dollari",
    eur: "Evro",
    rub: "Rossiya rubli",
    inputLabel: "Miqdorni kiriting",
  },
  en: {
    title: "Exchange rates",
    sub: "Current rates to Uzbek Som",
    updated: "Rates updated daily",
    usd: "US Dollar",
    eur: "Euro",
    rub: "Russian Ruble",
    inputLabel: "Enter amount",
  },
};

function fmt(n: number, dec = 0) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: dec });
}

export function CurrencyWidget({ locale }: { locale: string }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [input, setInput] = useState("");
  const [base, setBase] = useState<"USD" | "EUR" | "RUB">("USD");

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
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[color:var(--line)] bg-[var(--ink)] px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">{l.sub}</p>
        <p className="mt-0.5 font-serif text-xl font-semibold text-white">{l.title}</p>
      </div>

      <div className="p-6">
        {/* Rate cards */}
        <div className="grid grid-cols-3 gap-3">
          {currencies.map((c) => (
            <div key={c.key} className="rounded-xl bg-[var(--paper)] px-3 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                {c.flag} 1 {c.key}
              </p>
              {rates ? (
                <p className="mt-1 font-bold text-[var(--ink)]">{fmt(c.rate ?? 0)}</p>
              ) : (
                <div className="mt-1 mx-auto h-5 w-16 animate-pulse rounded bg-[var(--mist)]" />
              )}
              <p className="text-[9px] text-[var(--muted)] mt-0.5">UZS</p>
            </div>
          ))}
        </div>

        {/* Converter */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-[var(--muted)]">{l.inputLabel}</p>
          <div className="flex gap-2">
            <div className="flex flex-1 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[var(--paper)]">
              <input
                type="number"
                placeholder="0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-base font-bold text-[var(--ink)] focus:outline-none min-w-0"
              />
              <select
                value={base}
                onChange={(e) => setBase(e.target.value as "USD" | "EUR" | "RUB")}
                className="border-l border-[color:var(--line)] bg-transparent px-3 text-sm font-bold text-[var(--ink)] focus:outline-none cursor-pointer"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
              </select>
            </div>
          </div>
          {amount > 0 && rates && (
            <div className="mt-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3">
              <p className="text-lg font-bold text-[var(--ink)]">
                = {fmt(toUzs(base, amount))} <span className="text-sm font-normal text-[var(--muted)]">UZS</span>
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-right text-[10px] text-[var(--muted)]">{l.updated}</p>
      </div>
    </div>
  );
}
