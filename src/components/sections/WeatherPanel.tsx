"use client";

import { useEffect, useState } from "react";
import {
  formatTemp,
  moonPhase,
  aqiLabel,
  bestDayIdx,
  activity,
  getIsoDateMeta,
  getResortTodayMeta,
  type DayW,
} from "@/lib/weather";

/* ── Types ─────────────────────────────────────────────── */
interface CurrentW {
  temp: number; feelsLike: number; code: number;
  wind: number; humidity: number; pressure: number; uv: number;
}
interface WeatherData { current: CurrentW; daily: DayW[]; aqi: number; }

const RESORT_OPENED_YEAR = "2026";

/* ── WMO code maps ──────────────────────────────────────── */
const ICON: Record<number, string> = {
  0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",
  51:"🌦",53:"🌦",55:"🌦",61:"🌧",63:"🌧",65:"🌧",
  71:"❄️",73:"❄️",75:"❄️",80:"🌧",81:"🌧",82:"⛈",95:"⛈",96:"⛈",99:"⛈",
};

/* Bug fix: added missing WMO codes 48, 53, 55, 65, 73, 75, 81, 82, 96, 99 */
const COND: Record<number,{ru:string;uz:string;en:string}> = {
  0:{ru:"Ясно",uz:"Ochiq",en:"Clear"},
  1:{ru:"Преимущественно ясно",uz:"Asosan ochiq",en:"Mostly clear"},
  2:{ru:"Переменная облачность",uz:"O'zgaruvchan bulut",en:"Partly cloudy"},
  3:{ru:"Пасмурно",uz:"Bulutli",en:"Overcast"},
  45:{ru:"Туман",uz:"Tuman",en:"Foggy"},
  48:{ru:"Изморозь",uz:"Qirov tuman",en:"Icy fog"},
  51:{ru:"Лёгкая морось",uz:"Sekin yomg'ir",en:"Light drizzle"},
  53:{ru:"Морось",uz:"Yomg'irsimon",en:"Drizzle"},
  55:{ru:"Сильная морось",uz:"Kuchli sekin yomg'ir",en:"Dense drizzle"},
  61:{ru:"Небольшой дождь",uz:"Yengil yomg'ir",en:"Light rain"},
  63:{ru:"Дождь",uz:"Yomg'ir",en:"Rain"},
  65:{ru:"Сильный дождь",uz:"Kuchli yomg'ir",en:"Heavy rain"},
  71:{ru:"Снег",uz:"Qor",en:"Snow"},
  73:{ru:"Умеренный снег",uz:"O'rtacha qor",en:"Moderate snow"},
  75:{ru:"Сильный снег",uz:"Kuchli qor",en:"Heavy snow"},
  80:{ru:"Ливень",uz:"Jala",en:"Shower"},
  81:{ru:"Умеренный ливень",uz:"O'rtacha jala",en:"Moderate shower"},
  82:{ru:"Сильный ливень",uz:"Kuchli jala",en:"Heavy shower"},
  95:{ru:"Гроза",uz:"Momaqaldiroq",en:"Thunderstorm"},
  96:{ru:"Гроза с градом",uz:"Do'l bilan momaqaldiroq",en:"Thunderstorm with hail"},
  99:{ru:"Сильная гроза",uz:"Kuchli momaqaldiroq",en:"Heavy thunderstorm"},
};

/* ── Day / month names ──────────────────────────────────── */
const DAYS:Record<string,string[]> = {
  ru:["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  uz:["Ya","Du","Se","Ch","Pa","Ju","Sh"],
  en:["Su","Mo","Tu","We","Th","Fr","Sa"],
};
const MONTHS:Record<string,string[]> = {
  ru:["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября","Ноября","Декабря"],
  uz:["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"],
  en:["January","February","March","April","May","June","July","August","September","October","November","December"],
};

/* ── Labels ─────────────────────────────────────────────── */
const T:{[l:string]:{[k:string]:string}} = {
  ru:{
    badge:"АТМОСФЕРА КУРОРТА",location:"Чимганой, Узбекистан",
    sunrise:"Рассвет",sunset:"Закат",aqi:"AQI",
    feelsLike:"Ощущается",todayFor:"Сегодня лучше для",
    humidity:"Влажность",wind:"Ветер",pressure:"Давление",uv:"UV Индекс",
    moonLabel:"Фаза луны",altitude:"Высота курорта",
    forecast:"Прогноз на неделю",today:"Сег",
    bestBadge:"★ Лучший день",
    stargazing:"Отличные условия для наблюдения звёзд",
    kmh:"км/ч",hpa:"гПа",masl:"м н.у.м.",
    openedYear:"Год открытия",formats:"Форматов",territory:"Территория",
    title:"Горный курорт рядом с Ташкентом",
    desc:"CHIMGAN DARBAZA — в горах Чимгана. Глэмпинг, коттеджи, топчаны и ресторан в 45 минутах от Ташкента.",
  },
  uz:{
    badge:"KURORT ATMOSFERASI",location:"Chimgan Darbaza, O'zbekiston",
    sunrise:"Quyosh chiqishi",sunset:"Quyosh botishi",aqi:"AQI",
    feelsLike:"His qilinadi",todayFor:"Bugun uchun yaxshi",
    humidity:"Namlik",wind:"Shamol",pressure:"Bosim",uv:"UV Indeksi",
    moonLabel:"Oy fazasi",altitude:"Kurort balandligi",
    forecast:"Haftalik prognoz",today:"Bug",
    bestBadge:"★ Eng yaxshi kun",
    stargazing:"Yulduzlarni kuzatish uchun ajoyib sharoit",
    kmh:"km/soat",hpa:"gPa",masl:"m d.o.",
    openedYear:"Ochilgan yil",formats:"Formatlar",territory:"Hudud",
    title:"Toshkent yaqinidagi tog' kurorti",
    desc:"CHIMGAN DARBAZA — Chimgon tog'larida. Glemping, kottejlar, topchanlar va restoran Toshkentdan 45 daqiqada.",
  },
  en:{
    badge:"RESORT ATMOSPHERE",location:"Chimgan Darbaza, Uzbekistan",
    sunrise:"Sunrise",sunset:"Sunset",aqi:"AQI",
    feelsLike:"Feels like",todayFor:"Today is perfect for",
    humidity:"Humidity",wind:"Wind",pressure:"Pressure",uv:"UV Index",
    moonLabel:"Moon phase",altitude:"Resort altitude",
    forecast:"7-Day Forecast",today:"Now",
    bestBadge:"★ Best day",
    stargazing:"Great conditions for stargazing tonight",
    kmh:"km/h",hpa:"hPa",masl:"m a.s.l.",
    openedYear:"Opened",formats:"Stay types",territory:"Territory",
    title:"Mountain resort near Tashkent",
    desc:"CHIMGAN DARBAZA — in the Chimgan mountains. Glamping, cottages, topchans and restaurant, 45 min from Tashkent.",
  },
};

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 20 }: { w?: string; h?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-white/15"
      style={{ width: w, height: `${h}px` }}
    />
  );
}

/* ── Module-level cache: survives locale navigation within session ── */
let _wxCache: WeatherData | null = null;
let _wxCacheAt = 0;
const WX_TTL = 10 * 60 * 1000; // 10 minutes

/* ── Main component ─────────────────────────────────────── */
export function WeatherPanel({ locale }: { locale: string }) {
  const [data, setData] = useState<WeatherData|null>(_wxCache);
  const l = T[locale] ?? T.ru;
  const days = DAYS[locale] ?? DAYS.ru;
  const months = MONTHS[locale] ?? MONTHS.ru;

  useEffect(() => {
    // Serve cache instantly — no re-fetch on language switch
    if (_wxCache && Date.now() - _wxCacheAt < WX_TTL) {
      setData(_wxCache);
      return;
    }

    const base = "https://api.open-meteo.com/v1/forecast?latitude=41.6117&longitude=70.0133";
    const params = "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,surface_pressure,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia%2FTashkent&forecast_days=7";
    const aqiUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=41.6117&longitude=70.0133&current=us_aqi&timezone=Asia%2FTashkent";

    Promise.all([
      fetch(base+params).then(r=>r.json()),
      fetch(aqiUrl).then(r=>r.json()).catch(()=>({current:{us_aqi:15}})),
    ]).then(([w,a])=>{
      const c = w.current;
      const daily: DayW[] = (w.daily.time as string[]).map((_:string,i:number)=>({
        date: w.daily.time[i],
        code: w.daily.weather_code[i],
        max: Math.round(w.daily.temperature_2m_max[i]),
        min: Math.round(w.daily.temperature_2m_min[i]),
        sunrise: (w.daily.sunrise[i] as string).slice(11,16),
        sunset: (w.daily.sunset[i] as string).slice(11,16),
      }));
      const fresh: WeatherData = {
        current:{
          temp:Math.round(c.temperature_2m),
          feelsLike:Math.round(c.apparent_temperature),
          code:c.weather_code,
          wind:Math.round(c.wind_speed_10m),
          humidity:Math.round(c.relative_humidity_2m),
          pressure:Math.round(c.surface_pressure),
          uv:Math.round(c.uv_index),
        },
        daily,
        aqi:Math.round(a.current?.us_aqi??15),
      };
      _wxCache = fresh;
      _wxCacheAt = Date.now();
      setData(fresh);
    }).catch(()=>{});
  },[]);

  const resortToday = getResortTodayMeta();
  const moon = moonPhase(new Date(`${resortToday.isoDate}T12:00:00`));
  const todayDate = `${days[resortToday.dayIndex]}, ${resortToday.day} ${months[resortToday.monthIndex]}`;
  const todayForecast = data?.daily.find((day)=>day.date === resortToday.isoDate) ?? data?.daily[0];
  const bestIdx = data ? bestDayIdx(data.daily) : 0;
  const aqi = data ? aqiLabel(data.aqi, locale) : {text:"",color:"#22c55e"};

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-[var(--shadow-card)] border border-[color:var(--line)]">
        <div className="grid lg:grid-cols-[2fr_3fr]">

          {/* ── LEFT — resort info (hidden on mobile) ──── */}
          <div className="hidden lg:flex flex-col justify-between gap-8 bg-[var(--paper)] p-8 lg:p-10">
            <div>
              <span className="inline-block rounded-full border border-[color:var(--line)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">
                CHIMGAN DARBAZA
              </span>
              <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-[var(--ink)] lg:text-4xl">
                {l.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{l.desc}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-[color:var(--line)] pt-6">
              {[ 
                {label:l.openedYear, val:RESORT_OPENED_YEAR},
                {label:l.formats, val:"2"},
                {label:l.territory, val:"6 га"},
              ].map(s=>(
                <div key={s.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{s.label}</p>
                  <p className="mt-1 font-serif text-2xl font-bold text-[var(--ink)]">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Moon phase — unique feature */}
            <div className={`rounded-2xl border px-5 py-4 ${moon.stargazing ? "border-yellow-400/40 bg-yellow-50/60 dark:bg-yellow-900/20" : "border-[color:var(--line)] bg-[var(--surface)]"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{moon.icon}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{l.moonLabel}</p>
                  <p className="font-semibold text-[var(--ink)]">
                    {(locale === "uz" ? moon.uz : locale === "en" ? moon.en : moon.ru)}
                  </p>
                </div>
              </div>
              {moon.stargazing && (
                <p className="mt-2 text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  ✦ {l.stargazing}
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT — weather panel ─────────────────── */}
          <div className="bg-gradient-to-br from-[#1464a8] via-[#1155a0] to-[#0b3d80] p-4 text-white sm:p-6 lg:p-8">

            {/* Top bar */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  {l.badge}
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                  <span>{l.location}</span>
                  <span className="ml-2 text-white/50">·</span>
                  <span className="ml-2">{todayDate}</span>
                </div>
              </div>

              {/* Sunrise / Sunset / AQI — show empty pulse skeletons until data arrives */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                  <p className="text-[10px] text-white/60">{l.sunrise}</p>
                  {todayForecast ? (
                    <p className="font-bold tabular-nums">{todayForecast.sunrise}</p>
                  ) : (
                    <p className="font-bold animate-pulse text-white/30">·:·</p>
                  )}
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                  <p className="text-[10px] text-white/60">{l.sunset}</p>
                  {todayForecast ? (
                    <p className="font-bold tabular-nums">{todayForecast.sunset}</p>
                  ) : (
                    <p className="font-bold animate-pulse text-white/30">·:·</p>
                  )}
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center min-w-[60px]">
                  <div className="flex items-center gap-1 justify-center">
                    <span className="h-2 w-2 rounded-full" style={{background:aqi.color}} />
                    <p className="text-[10px] text-white/60">{l.aqi}</p>
                  </div>
                  {data ? (
                    <p className="font-bold tabular-nums">{data.aqi}</p>
                  ) : (
                    <p className="font-bold animate-pulse text-white/30">·</p>
                  )}
                  <p className="text-[9px] text-white/60">{aqi.text}</p>
                </div>
              </div>
            </div>

            {/* Main temp */}
            <div className="mt-4 sm:mt-6 flex items-end gap-4 sm:gap-6">
              <div>
                {data ? (
                  <p className="font-serif text-6xl sm:text-8xl font-bold leading-none tracking-tight">
                    {formatTemp(data.current.temp)}
                  </p>
                ) : <Skeleton w="8rem" h={80} />}
                <div className="mt-2">
                  {data ? (
                    <>
                      <p className="text-xl font-semibold">
                        {(COND[data.current.code] as Record<string,string>)?.[locale] ?? (COND[data.current.code] as Record<string,string>)?.ru ?? ""}
                      </p>
                      <p className="text-sm text-white/65">
                        {l.feelsLike} {formatTemp(data.current.feelsLike)}
                      </p>
                      <p className="mt-2 text-sm text-white/75">
                        <span className="text-white/50">{l.todayFor}:</span>{" "}
                        <span className="font-semibold">{activity(data.current.code, data.current.temp, locale)}</span>
                      </p>
                    </>
                  ) : <Skeleton w="10rem" h={20} />}
                </div>
              </div>
              {data && (
                <span className="text-6xl leading-none">{ICON[data.current.code] ?? "🌡"}</span>
              )}
            </div>

            {/* Stats grid */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {label:l.humidity,  val: data ? `${data.current.humidity}%`   : null},
                {label:l.wind,      val: data ? `${data.current.wind} ${l.kmh}` : null},
                {label:l.pressure,  val: data ? `${data.current.pressure} ${l.hpa}` : null},
                {label:l.uv,        val: data ? String(Math.round(data.current.uv)) : null},
                {label:l.altitude,  val: "1 050 "+l.masl},
                {label:l.aqi,       val: data ? String(data.aqi)               : null, color: aqi.color},
              ].map(s=>(
                <div key={s.label} className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{s.label}</p>
                  {s.val ? (
                    <p className="mt-0.5 font-bold text-sm" style={s.color?{color:s.color}:{}}>{s.val}</p>
                  ) : <Skeleton w="4rem" h={16} />}
                </div>
              ))}
            </div>

            {/* 7-day forecast */}
            <div className="mt-4 sm:mt-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/55">{l.forecast}</p>
              <div className="grid grid-cols-7 gap-1 overflow-x-auto">
                {data ? data.daily.map((d,i)=>{
                  const dayMeta = getIsoDateMeta(d.date);
                  const isToday = d.date === resortToday.isoDate;
                  const isBest = i === bestIdx;
                  return (
                    <div
                      key={d.date}
                      className={`relative rounded-xl px-1 py-2 text-center transition-all ${
                        isBest
                          ? "bg-yellow-400/25 ring-1 ring-yellow-400/60"
                          : isToday ? "bg-white/18" : "bg-white/8"
                      }`}
                    >
                      {isBest && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-1 text-[7px] font-bold text-yellow-900 whitespace-nowrap">
                          {l.bestBadge}
                        </span>
                      )}
                      <p className="text-[10px] font-bold text-white/60">
                        {isToday ? l.today : days[dayMeta.dayIndex]}
                      </p>
                      <p className="my-1 text-base leading-none">{ICON[d.code]??"🌡"}</p>
                      <p className="text-xs font-bold">{formatTemp(d.max)}</p>
                      <p className="text-[10px] text-white/50">{formatTemp(d.min)}</p>
                    </div>
                  );
                }) : Array.from({length:7}).map((_,i)=>(
                  <div key={i} className="rounded-xl bg-white/8 px-1 py-2">
                    <Skeleton h={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
