"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ isHeroPage }: { isHeroPage?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="h-8 w-8" />;

  const light = isHeroPage && !document.documentElement.getAttribute("data-scrolled");

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex h-8 w-14 items-center rounded-full border transition-all duration-300 ${
        dark
          ? "border-white/20 bg-white/10"
          : isHeroPage
          ? "border-white/20 bg-white/10"
          : "border-[color:var(--line)] bg-[var(--surface)]"
      }`}
    >
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full text-xs shadow-md transition-all duration-300 ${
          dark
            ? "left-7 bg-[var(--ink)] text-[var(--paper)]"
            : "left-1 bg-white text-[var(--ink)]"
        }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
