"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Locale = "ru" | "uz" | "en";

type GuestSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
  locale: Locale;
};

const guestLabels: Record<Locale, string[]> = {
  ru: ["1 гость", "2 гостя", "3 гостя", "4 гостя", "5 гостей", "6 гостей", "7 гостей", "8 гостей (макс.)"],
  uz: ["1 mehmon", "2 mehmon", "3 mehmon", "4 mehmon", "5 mehmon", "6 mehmon", "7 mehmon", "8 mehmon (maks.)"],
  en: ["1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests", "7 guests", "8 guests (max)"],
};

const optionValues = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function GuestSelect({ name, label, defaultValue = "2", locale }: GuestSelectProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // The dropdown renders in a portal (document.body) with fixed positioning, so an
  // ancestor's `overflow-hidden` (the hero clips its slideshow/snow) can't crop it,
  // and the rotating photo strip below the hero can't overlap it. `pos` holds the
  // computed viewport coords (set on open + scroll/resize).
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute the dropdown's fixed-viewport coords. Flips above the field when there's
  // no room below; clamps into the viewport. Matches the trigger's width.
  const place = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const LIST_H = 360; // approx dropdown height (px)
    const margin = 8;
    const width = Math.max(rect.width, 200);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < LIST_H + margin && rect.top > spaceBelow;
    let left = Math.min(rect.left, window.innerWidth - width - margin);
    left = Math.max(margin, left);
    const top = openUp ? Math.max(margin, rect.top - margin - LIST_H) : rect.bottom + margin;
    setPos({ left, top, width });
  }, []);

  // Measure synchronously on open so the portal appears placed in the same render.
  const toggleOpen = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  // Keep the dropdown glued to the trigger while open.
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

  const selectedIndex = optionValues.indexOf(value);
  const displayLabel = selectedIndex >= 0 ? guestLabels[locale][selectedIndex] : guestLabels[locale][1];

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
          <Icon name="user" className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="flex items-center justify-between text-sm font-bold text-[var(--ink)]">
          <span>{displayLabel}</span>
          <svg
            className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            width: pos?.width ?? 220,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-[100] max-h-[min(360px,70vh)] overflow-auto rounded-xl border border-[color:var(--line)] bg-[var(--paper)] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
        >
          {optionValues.map((v, i) => {
            const isSelected = v === value;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setValue(v);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                    : "text-[var(--ink)] hover:bg-[var(--surface)]"
                }`}
              >
                <span>{guestLabels[locale][i]}</span>
                {isSelected && (
                  <svg className="h-4 w-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
