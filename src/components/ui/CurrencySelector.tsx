"use client";

import { useEffect, useRef, useState } from "react";

const CURRENCIES = [
  { code: "UZS", name: "Uzbek Som" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "GBP", name: "British Pound" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AED", name: "UAE Dirham" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "KGS", name: "Kyrgyzstani Som" },
  { code: "TJS", name: "Tajikistani Somoni" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "INR", name: "Indian Rupee" },
];

type Rates = Record<string, number>;

export function CurrencySelector({ onDark }: { onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("UZS");
  const [search, setSearch] = useState("");
  const [rates, setRates] = useState<Rates>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")
      .then(r => r.json())
      .then(d => setRates(d.usd as Rates))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function rate(code: string): string {
    if (code === "UZS") return rates.uzs ? `1 USD = ${Math.round(rates.uzs).toLocaleString()} UZS` : "";
    const r = rates[code.toLowerCase()];
    return r ? `1 USD = ${r.toFixed(2)} ${code}` : "";
  }

  const textColor = onDark ? "text-white/80 hover:text-white" : "text-[var(--ink)]";
  const borderColor = onDark ? "border-white/20 bg-white/10 hover:bg-white/15" : "border-[color:var(--line)] bg-[var(--surface)] hover:bg-[var(--mist)]";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${borderColor} ${textColor}`}
      >
        <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
        </svg>
        {selected}
        <svg className={`h-3 w-3 opacity-50 transition-transform ${open?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] shadow-[var(--shadow-float)]">
          <div className="border-b border-[color:var(--line)] px-4 py-3">
            <p className="text-xs font-bold text-[var(--ink)]">Выберите валюту</p>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="mt-2 w-full rounded-lg border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                onClick={() => { setSelected(c.code); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface)] ${selected === c.code ? "bg-[var(--surface)] font-bold text-[var(--ink)]" : "text-[var(--ink)]"}`}
              >
                <span>{c.code} — {c.name}</span>
                {selected === c.code && (
                  <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
          {rates.uzs && (
            <div className="border-t border-[color:var(--line)] bg-[var(--surface)] px-4 py-2">
              <p className="text-[10px] text-[var(--muted)]">{rate(selected)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
