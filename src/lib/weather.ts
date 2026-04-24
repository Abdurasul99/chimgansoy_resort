/* Pure utility functions for WeatherPanel — tested in src/lib/__tests__/weather.test.ts */

export interface DayW {
  date: string;
  code: number;
  max: number;
  min: number;
  sunrise: string;
  sunset: string;
}

/* Format temperature with correct +/- sign */
export function formatTemp(n: number): string {
  return `${n > 0 ? "+" : ""}${n}°`;
}

/* Moon phase (no API needed) */
export function moonPhase(date: Date): { icon: string; ru: string; uz: string; en: string; stargazing: boolean } {
  const ref = new Date(2000, 0, 6);
  const cycle = 29.53058867;
  const p = (((date.getTime() - ref.getTime()) / 86400000) % cycle + cycle) % cycle;
  if (p < 1.85)  return { icon: "🌑", ru: "Новолуние",          uz: "Yangi oy",            en: "New Moon",        stargazing: false };
  if (p < 7.38)  return { icon: "🌒", ru: "Растущий серп",       uz: "O'sib kelayotgan oy", en: "Waxing Crescent", stargazing: false };
  if (p < 9.22)  return { icon: "🌓", ru: "Первая четверть",     uz: "Birinchi chorak",     en: "First Quarter",   stargazing: false };
  if (p < 14.77) return { icon: "🌔", ru: "Растущая луна",       uz: "O'sib kelayotgan",    en: "Waxing Gibbous",  stargazing: false };
  if (p < 16.61) return { icon: "🌕", ru: "Полнолуние",          uz: "To'lin oy",           en: "Full Moon",       stargazing: true  };
  if (p < 22.15) return { icon: "🌖", ru: "Убывающая луна",      uz: "So'nib boruvchi",     en: "Waning Gibbous",  stargazing: false };
  if (p < 23.99) return { icon: "🌗", ru: "Последняя четверть",  uz: "Oxirgi chorak",       en: "Last Quarter",    stargazing: false };
  return           { icon: "🌘", ru: "Убывающий серп",           uz: "So'nib boruvchi oy",  en: "Waning Crescent", stargazing: false };
}

/* AQI label */
export function aqiLabel(v: number, l: string): { text: string; color: string } {
  if (v <= 20) return { text: l === "ru" ? "Отлично"  : l === "uz" ? "A'lo"     : "Excellent", color: "#22c55e" };
  if (v <= 40) return { text: l === "ru" ? "Хорошо"   : l === "uz" ? "Yaxshi"   : "Good",      color: "#84cc16" };
  if (v <= 60) return { text: l === "ru" ? "Умеренно" : l === "uz" ? "O'rtacha" : "Moderate",  color: "#eab308" };
  return         { text: l === "ru" ? "Плохо"     : l === "uz" ? "Yomon"    : "Poor",      color: "#f97316" };
}

/* Best day index (highest weather score + temperature comfort) */
export function bestDayIdx(daily: DayW[]): number {
  return daily.reduce((best, d, i) => {
    const score  = (d.code <= 2 ? 10 : d.code <= 3 ? 5 : 0) + Math.min(d.max, 28) / 2.8;
    const bScore = (daily[best].code <= 2 ? 10 : daily[best].code <= 3 ? 5 : 0) + Math.min(daily[best].max, 28) / 2.8;
    return score > bScore ? i : best;
  }, 0);
}

/* Activity suggestion */
export function activity(code: number, temp: number, l: string): string {
  const a: { [k: string]: { ru: string; uz: string; en: string } } = {
    pool:     { ru: "отдыха у бассейна",            uz: "basseyn bo'yida dam olish",  en: "pool & loungers" },
    hike:     { ru: "прогулок по горным тропам",    uz: "tog' yo'llarida sayr",       en: "mountain hikes" },
    indoor:   { ru: "ужина в ресторане",             uz: "restoranda kechki ovqat",    en: "restaurant dinner" },
    glamping: { ru: "наблюдения звёзд с глэмпинга", uz: "glempingdan yulduzli osmon", en: "stargazing from glamping" },
    bbq:      { ru: "барбекю на свежем воздухе",    uz: "ochiq havoda barbekyu",      en: "outdoor barbecue" },
    sport:    { ru: "паделя и активного спорта",    uz: "padel va faol sport",        en: "padel & sports" },
  };
  const pick =
    code === 0 && temp >= 22 ? "pool" :
    code === 0 && temp < 22  ? "glamping" :
    code <= 2 && temp >= 16  ? "hike" :
    code <= 2                ? "bbq" :
    code <= 3                ? "sport" :
                               "indoor";
  return (a[pick] as Record<string, string>)[l] ?? (a[pick] as Record<string, string>).ru;
}

/* Parse ISO date string (YYYY-MM-DD) to meta object */
export function getIsoDateMeta(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dayIndex = new Date(`${isoDate}T12:00:00`).getDay();
  return { isoDate, year, monthIndex: month - 1, day, dayIndex };
}

/* Get current resort date in Asia/Tashkent timezone */
export function getResortTodayMeta(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year  = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day   = parts.find((p) => p.type === "day")?.value;
  return getIsoDateMeta(`${year}-${month}-${day}`);
}
