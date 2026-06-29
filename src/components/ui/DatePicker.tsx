"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Locale = "ru" | "uz" | "en";

type DatePickerProps = {
  name: string;
  label: string;
  defaultValue?: string;
  locale: Locale;
  minToday?: boolean;
};

const monthNames: Record<Locale, string[]> = {
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const monthShort: Record<Locale, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const weekdayShort: Record<Locale, string[]> = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const placeholders: Record<Locale, string> = {
  ru: "Выбрать дату",
  uz: "Sana tanlash",
  en: "Pick a date",
};

const clearLabels: Record<Locale, string> = { ru: "Сбросить", uz: "Tozalash", en: "Clear" };
const todayLabels: Record<Locale, string> = { ru: "Сегодня", uz: "Bugun", en: "Today" };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function fromISO(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function displayValue(iso: string, locale: Locale): string {
  const p = fromISO(iso);
  if (!p) return "";
  return `${p.d} ${monthShort[locale][p.m]} ${p.y}`;
}

export function DatePicker({ name, label, defaultValue = "", locale, minToday = false }: DatePickerProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // The calendar renders in a portal (document.body) with fixed positioning, so an
  // ancestor's `overflow-hidden` (e.g. the hero, which clips snow/decorations) can
  // never crop it. `pos` holds the computed viewport coords (set on open + scroll/resize).
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [view, setView] = useState(() => {
    const parsed = fromISO(defaultValue) ?? null;
    if (parsed) return { y: parsed.y, m: parsed.m };
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Derived once. The cells that use `today` only render inside the portal
  // (client-only, after a click), so there's no SSR hydration mismatch.
  const [today] = useState<string>(() => {
    const now = new Date();
    return toISO(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Compute the popover's fixed-viewport coords. Flips above the field when there's
  // no room below; clamps into the viewport. Called on open and on scroll/resize.
  const place = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const CAL_H = 380; // approx popover height (px)
    const margin = 8;
    const width = Math.min(304, window.innerWidth - 16); // 304px = 19rem
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < CAL_H + margin && rect.top > spaceBelow;
    let left = Math.min(rect.left, window.innerWidth - width - margin);
    left = Math.max(margin, left);
    const top = openUp ? Math.max(margin, rect.top - margin - CAL_H) : rect.bottom + margin;
    setPos({ left, top, width });
  }, []);

  // Measure synchronously on open so the portal appears correctly placed in the
  // same render (no flicker, no setState-in-effect).
  const toggleOpen = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  // Keep the popover glued to the trigger while open. These fire from real events,
  // so they don't trigger cascading renders.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true); // capture: catch scroll in any ancestor
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return; // clicks inside the portal stay open
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function navPrev() {
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  }
  function navNext() {
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  }
  function select(iso: string) {
    setValue(iso);
    setOpen(false);
  }
  function clear() {
    setValue("");
  }
  function goToday() {
    if (!today) return;
    const t = fromISO(today)!;
    setView({ y: t.y, m: t.m });
    setValue(today);
    setOpen(false);
  }

  // Build calendar grid (42 cells: leading gray + month + trailing gray)
  const firstWeekday = new Date(view.y, view.m, 1).getDay(); // Sun=0
  const startCol = (firstWeekday + 6) % 7; // Mon=0
  const daysThis = new Date(view.y, view.m + 1, 0).getDate();
  const daysPrev = new Date(view.y, view.m, 0).getDate();
  const prev = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 };
  const next = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };

  const cells: Array<{ iso: string; day: number; current: boolean }> = [];
  for (let i = startCol - 1; i >= 0; i--) {
    const d = daysPrev - i;
    cells.push({ iso: toISO(prev.y, prev.m, d), day: d, current: false });
  }
  for (let d = 1; d <= daysThis; d++) cells.push({ iso: toISO(view.y, view.m, d), day: d, current: true });
  while (cells.length < 42) {
    const d = cells.length - startCol - daysThis + 1;
    cells.push({ iso: toISO(next.y, next.m, d), day: d, current: false });
  }

  const labels = weekdayShort[locale];
  const months = monthNames[locale];

  return (
    <div className="relative" ref={wrapperRef}>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={toggleOpen}
        className={`flex w-full min-h-14 flex-col justify-center gap-1 rounded-[6px] border bg-[var(--surface)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--accent)]/40 ${
          open ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15" : "border-[color:var(--line)]"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className={`text-sm font-bold ${value ? "text-[var(--ink)]" : "text-[var(--muted)]/60"}`}>
          {value ? displayValue(value, locale) : placeholders[locale]}
        </span>
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            width: pos?.width ?? 304,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-[100] rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
        >
          {/* Header — month / year + nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={navPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="font-serif text-sm font-semibold text-[var(--ink)]">
              {months[view.m]} <span className="text-[var(--muted)]">{view.y}</span>
            </p>
            <button
              type="button"
              onClick={navNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {labels.map((d, i) => (
              <span
                key={d}
                className={`text-center text-[10px] font-bold uppercase tracking-wider ${
                  i >= 5 ? "text-[var(--accent-strong)]/70" : "text-[var(--muted)]"
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === today;
              const isDisabled = minToday && today && cell.iso < today;
              return (
                <button
                  key={`${cell.iso}-${idx}`}
                  type="button"
                  disabled={Boolean(isDisabled)}
                  onClick={() => select(cell.iso)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-all ${
                    isSelected
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : isDisabled
                        ? "cursor-not-allowed text-[var(--muted)]/30"
                        : cell.current
                          ? "text-[var(--ink)] hover:bg-[var(--surface)]"
                          : "text-[var(--muted)]/40 hover:bg-[var(--surface)]"
                  } ${isToday && !isSelected ? "ring-1 ring-[var(--accent)]/40" : ""}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-4 flex items-center justify-between border-t border-[color:var(--line)] pt-3">
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              {clearLabels[locale]}
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
            >
              {todayLabels[locale]}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
