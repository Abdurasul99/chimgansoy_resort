/**
 * Live mountain weather for the guest Telegram bot — open-meteo.com (free, no
 * key). Coordinates: Chimgan Darbaza (1700 m). Cached in-process for 10 min.
 * (Separate from src/lib/weather.ts, which holds the site WeatherPanel utils.)
 */

import { googleMapsIntegration } from "@/content/integrations";

export type ChimganWeather = {
  tempC: number;
  feelsC: number;
  windKmh: number;
  code: number;
  todayMin: number;
  todayMax: number;
  tomorrowMin: number;
  tomorrowMax: number;
};

type WeatherResult = { ok: true; data: ChimganWeather } | { ok: false; error: string };

// WMO weather codes → human description + emoji.
const CODES: [number[], string, string][] = [
  [[0], "ясно", "☀️"],
  [[1], "преимущественно ясно", "🌤"],
  [[2], "переменная облачность", "⛅️"],
  [[3], "пасмурно", "☁️"],
  [[45, 48], "туман", "🌫"],
  [[51, 53, 55, 56, 57], "морось", "🌦"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "дождь", "🌧"],
  [[71, 73, 75, 77, 85, 86], "снег", "🌨"],
  [[95, 96, 99], "гроза", "⛈"],
];

export function weatherInfo(code: number): { desc: string; emoji: string } {
  for (const [codes, desc, emoji] of CODES) if (codes.includes(code)) return { desc, emoji };
  return { desc: "переменная погода", emoji: "🌤" };
}

const RAINY = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOWY = new Set([71, 73, 75, 77, 85, 86]);

/** One practical clothing/visit tip based on the numbers. */
export function weatherAdvice(w: ChimganWeather): string {
  if (SNOWY.has(w.code)) return "В горах снег — тёплая одежда и нескользящая обувь обязательны ❄️";
  if (RAINY.has(w.code)) return "Возможен дождь — захватите дождевик или зонт ☔️";
  if (w.todayMin < 8) return "Ночью в горах холодно — обязательно возьмите тёплую куртку 🧥";
  if (w.todayMin < 16) return "Вечером в горах прохладно — возьмите тёплую кофту или куртку 🧥";
  if (w.todayMax >= 28) return "Жарко и солнечно — не забудьте головной убор и солнцезащитный крем 🧴";
  return "Отличная погода для гор — приезжайте! 😊";
}

let cache: { at: number; data: ChimganWeather } | null = null;
const TTL = 10 * 60_000;

export async function getChimganWeather(): Promise<WeatherResult> {
  if (cache && Date.now() - cache.at < TTL) return { ok: true, data: cache.data };
  const { lat, lng } = googleMapsIntegration.coordinates;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTashkent&forecast_days=2`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const j = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    if (!j.current || !j.daily) return { ok: false, error: "bad_response" };
    const data: ChimganWeather = {
      tempC: Math.round(j.current.temperature_2m ?? 0),
      feelsC: Math.round(j.current.apparent_temperature ?? j.current.temperature_2m ?? 0),
      windKmh: Math.round(j.current.wind_speed_10m ?? 0),
      code: j.current.weather_code ?? 1,
      todayMax: Math.round(j.daily.temperature_2m_max?.[0] ?? 0),
      todayMin: Math.round(j.daily.temperature_2m_min?.[0] ?? 0),
      tomorrowMax: Math.round(j.daily.temperature_2m_max?.[1] ?? 0),
      tomorrowMin: Math.round(j.daily.temperature_2m_min?.[1] ?? 0),
    };
    cache = { at: Date.now(), data };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Format a temperature with an explicit sign: 22 → "+22°", -3 → "−3°". */
export function t(n: number): string {
  return n > 0 ? `+${n}°` : n < 0 ? `−${Math.abs(n)}°` : "0°";
}
