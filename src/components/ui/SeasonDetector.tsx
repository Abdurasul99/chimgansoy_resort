"use client";

import { useEffect } from "react";

export function SeasonDetector() {
  useEffect(() => {
    const month = new Date().getMonth() + 1;
    const isWinter = month === 12 || month <= 3;
    document.documentElement.setAttribute("data-season", isWinter ? "winter" : "summer");
  }, []);

  return null;
}
