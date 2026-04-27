"use client";

import { useEffect } from "react";

const STORAGE_KEY = "cgs_season";

export function SeasonDetector() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as "winter" | "summer" | null;
    if (saved) {
      document.documentElement.setAttribute("data-season", saved);
      return;
    }
    const month = new Date().getMonth() + 1;
    const auto = month === 12 || month <= 3 ? "winter" : "summer";
    document.documentElement.setAttribute("data-season", auto);
  }, []);

  return null;
}

export function toggleSeason() {
  const current = document.documentElement.getAttribute("data-season") ?? "summer";
  const next = current === "winter" ? "summer" : "winter";
  document.documentElement.setAttribute("data-season", next);
  localStorage.setItem(STORAGE_KEY, next);
}

export function getSeason(): "winter" | "summer" {
  if (typeof document === "undefined") return "summer";
  return (document.documentElement.getAttribute("data-season") as "winter" | "summer") ?? "summer";
}
