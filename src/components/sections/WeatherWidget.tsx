"use client";

import { useEffect, useState } from "react";

const WMO: Record<number, string> = {
  0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️",
  45: "🌫", 48: "🌫",
  51: "🌦", 53: "🌦", 55: "🌦",
  61: "🌧", 63: "🌧", 65: "🌧",
  71: "❄️", 73: "❄️", 75: "❄️",
  80: "🌧", 81: "🌧", 82: "⛈",
  95: "⛈", 96: "⛈", 99: "⛈",
};

const labels: Record<string, { now: string; wind: string }> = {
  ru: { now: "в Чимгане", wind: "ветер" },
  uz: { now: "Chimgonda", wind: "shamol" },
  en: { now: "at Chimgan", wind: "wind" },
};

export function WeatherWidget({ locale }: { locale: string }) {
  const [data, setData] = useState<{ temp: number; code: number; wind: number } | null>(null);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.6117&longitude=70.0133&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FTashkent"
    )
      .then((r) => r.json())
      .then((d) =>
        setData({
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
          wind: Math.round(d.current.wind_speed_10m),
        })
      )
      .catch(() => {});
  }, []);

  if (!data) return null;

  const icon = WMO[data.code] ?? "🌡";
  const l = labels[locale] ?? labels.ru;

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm text-white backdrop-blur-md">
      <span className="text-base leading-none">{icon}</span>
      <span className="font-bold">{data.temp}°C</span>
      <span className="text-white/40">·</span>
      <span className="text-white/70">{l.now}</span>
      <span className="text-white/40">·</span>
      <span className="text-white/55">{l.wind} {data.wind} км/ч</span>
    </div>
  );
}
