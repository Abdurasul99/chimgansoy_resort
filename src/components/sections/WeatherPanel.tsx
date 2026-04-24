"use client";

import { useEffect, useState } from "react";

/* ── Types ─────────────────────────────────────────────── */
interface CurrentW {
  temp: number; feelsLike: number; code: number;
  wind: number; humidity: number; pressure: number; uv: number;
}
interface DayW { date: string; code: number; max: number; min: number; sunrise: string; sunset: string; }
interface WeatherData { current: CurrentW; daily: DayW[]; aqi: number; }

/* ── WMO code maps ──────────────────────────────────────── */
const ICON: Record<number, string> = {
  0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",
  51:"🌦",53:"🌦",55:"🌦",61:"🌧",63:"🌧",65:"🌧",
  71:"❄️",73:"❄️",75:"❄️",80:"🌧",81:"🌧",82:"⛈",95:"⛈",96:"⛈",99:"⛈",
};
const COND: Record<number,{ru:string;uz:string;en:string}> = {
  0:{ru:"Ясно",uz:"Ochiq",en:"Clear"},
  1:{ru:"Преимущественно ясно",uz:"Asosan ochiq",en:"Mostly clear"},
  2:{ru:"Переменная облачность",uz:"O'zgaruvchan bulut",en:"Partly cloudy"},
  3:{ru:"Пасмурно",uz:"Bulutli",en:"Overcast"},
  45:{ru:"Туман",uz:"Tuman",en:"Foggy"},
  51:{ru:"Лёгкая морось",uz:"Sekin yomg'ir",en:"Light drizzle"},
  61:{ru:"Небольшой дождь",uz:"Yengil yomg'ir",en:"Light rain"},
  63:{ru:"Дождь",uz:"Yomg'ir",en:"Rain"},
  71:{ru:"Снег",uz:"Qor",en:"Snow"},
  80:{ru:"Ливень",uz:"Jala",en:"Shower"},
  95:{ru:"Гроза",uz:"Momaqaldiroq",en:"Thunderstorm"},
};

/* ── AQI ────────────────────────────────────────────────── */
function aqiLabel(v:number,l:string):{text:string;color:string} {
  if(v<=20) return{text:l==="ru"?"Отлично":l==="uz"?"A'lo":"Excellent",color:"#22c55e"};
  if(v<=40) return{text:l==="ru"?"Хорошо":l==="uz"?"Yaxshi":"Good",color:"#84cc16"};
  if(v<=60) return{text:l==="ru"?"Умеренно":l==="uz"?"O'rtacha":"Moderate",color:"#eab308"};
  return{text:l==="ru"?"Плохо":l==="uz"?"Yomon":"Poor",color:"#f97316"};
}

/* ── Moon phase (no API needed) ─────────────────────────── */
function moonPhase(date:Date):{icon:string;ru:string;uz:string;en:string;stargazing:boolean} {
  const ref = new Date(2000,0,6);
  const cycle = 29.53058867;
  const p = (((date.getTime()-ref.getTime())/86400000)%cycle+cycle)%cycle;
  if(p<1.85)  return{icon:"🌑",ru:"Новолуние",       uz:"Yangi oy",           en:"New Moon",       stargazing:false};
  if(p<7.38)  return{icon:"🌒",ru:"Растущий серп",    uz:"O'sib kelayotgan oy",en:"Waxing Crescent",stargazing:false};
  if(p<9.22)  return{icon:"🌓",ru:"Первая четверть",  uz:"Birinchi chorak",    en:"First Quarter",  stargazing:false};
  if(p<14.77) return{icon:"🌔",ru:"Растущая луна",    uz:"O'sib kelayotgan",   en:"Waxing Gibbous", stargazing:false};
  if(p<16.61) return{icon:"🌕",ru:"Полнолуние",       uz:"To'lin oy",          en:"Full Moon",      stargazing:true};
  if(p<22.15) return{icon:"🌖",ru:"Убывающая луна",   uz:"So'nib boruvchi",    en:"Waning Gibbous", stargazing:false};
  if(p<23.99) return{icon:"🌗",ru:"Последняя четверть",uz:"Oxirgi chorak",     en:"Last Quarter",   stargazing:false};
  return      {icon:"🌘",ru:"Убывающий серп",         uz:"So'nib boruvchi oy", en:"Waning Crescent",stargazing:false};
}

/* ── Best day to visit ──────────────────────────────────── */
function bestDayIdx(daily:DayW[]):number {
  return daily.reduce((best,d,i)=>{
    const score = (d.code<=2?10:d.code<=3?5:0) + Math.min(d.max,28)/2.8;
    const bScore = (daily[best].code<=2?10:daily[best].code<=3?5:0)+Math.min(daily[best].max,28)/2.8;
    return score>bScore?i:best;
  },0);
}

/* ── Activity suggestion ────────────────────────────────── */
function activity(code:number,temp:number,l:string):string {
  const a:{[k:string]:{ru:string;uz:string;en:string}} = {
    pool:{ru:"отдыха у бассейна",uz:"basseyn bo'yida dam olish",en:"pool & loungers"},
    hike:{ru:"прогулок по горным тропам",uz:"tog' yo'llarida sayr",en:"mountain hikes"},
    indoor:{ru:"ужина в ресторане",uz:"restoranda kechki ovqat",en:"restaurant dinner"},
    glamping:{ru:"наблюдения звёзд с глэмпинга",uz:"glempingdan yulduzli osmon",en:"stargazing from glamping"},
    bbq:{ru:"барбекю на свежем воздухе",uz:"ochiq havoda barbekyu",en:"outdoor barbecue"},
    sport:{ru:"паделя и активного спорта",uz:"padel va faol sport",en:"padel & sports"},
  };
  const pick = (code===0&&temp>=22)?"pool":(code===0&&temp<22)?"glamping":(code<=2&&temp>=16)?"hike":(code<=2)?"bbq":(code<=3)?"sport":"indoor";
  return (a[pick] as Record<string,string>)[l] ?? (a[pick] as Record<string,string>).ru;
}

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
    desc:"CHIMGANSOY — 6 гектаров в горах Чимгана. Глэмпинг, коттеджи, ресторан и бассейн в 45 минутах от Ташкента.",
  },
  uz:{
    badge:"KURORT ATMOSFERASI",location:"Chimgansoy, O'zbekiston",
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
    desc:"CHIMGANSOY — Chimgon tog'larida 6 gektar. Glemping, kottejlar, restoran va basseyn Toshkentdan 45 daqiqada.",
  },
  en:{
    badge:"RESORT ATMOSPHERE",location:"Chimgansoy, Uzbekistan",
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
    desc:"CHIMGANSOY — 6 hectares in the Chimgan mountains. Glamping, cottages, restaurant and pool, 45 min from Tashkent.",
  },
};

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({w="full",h=5}:{w?:string;h?:number}) {
  return <div className={`animate-pulse rounded-lg bg-white/15 w-${w} h-${h}`} />;
}

/* ── Main component ─────────────────────────────────────── */
export function WeatherPanel({ locale }: { locale: string }) {
  const [data, setData] = useState<WeatherData|null>(null);
  const l = T[locale] ?? T.ru;
  const days = DAYS[locale] ?? DAYS.ru;
  const months = MONTHS[locale] ?? MONTHS.ru;

  useEffect(() => {
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
      setData({
        current:{
          temp:Math.round(c.temperature_2m),
          feelsLike:Math.round(c.apparent_temperature),
          code:c.weather_code,
          wind:Math.round(c.wind_speed_10m),
          humidity:Math.round(c.relative_humidity_2m),
          pressure:Math.round(c.surface_pressure),
          uv:parseFloat(c.uv_index.toFixed(2)),
        },
        daily,
        aqi:Math.round(a.current?.us_aqi??15),
      });
    }).catch(()=>{});
  },[]);

  const now = new Date();
  const moon = moonPhase(now);
  const todayDay = days[now.getDay()];
  const todayDate = `${todayDay}, ${now.getDate()} ${months[now.getMonth()]}`;
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
                CHIMGANSOY
              </span>
              <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-[var(--ink)] lg:text-4xl">
                {l.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{l.desc}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-[color:var(--line)] pt-6">
              {[
                {label:l.openedYear, val:"2025"},
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

              {/* Sunrise / Sunset / AQI */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                  <p className="text-[10px] text-white/60">{l.sunrise}</p>
                  <p className="font-bold">{data ? data.daily[0].sunrise : "--:--"}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                  <p className="text-[10px] text-white/60">{l.sunset}</p>
                  <p className="font-bold">{data ? data.daily[0].sunset : "--:--"}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-center min-w-[60px]">
                  <div className="flex items-center gap-1 justify-center">
                    <span className="h-2 w-2 rounded-full" style={{background:aqi.color}} />
                    <p className="text-[10px] text-white/60">{l.aqi}</p>
                  </div>
                  <p className="font-bold">{data ? data.aqi : "--"}</p>
                  <p className="text-[9px] text-white/60">{aqi.text}</p>
                </div>
              </div>
            </div>

            {/* Main temp */}
            <div className="mt-4 sm:mt-6 flex items-end gap-4 sm:gap-6">
              <div>
                {data ? (
                  <p className="font-serif text-6xl sm:text-8xl font-bold leading-none tracking-tight">
                    {data.current.temp > 0 ? "+" : ""}{data.current.temp}°
                  </p>
                ) : <Skeleton w="32" h={20} />}
                <div className="mt-2">
                  {data ? (
                    <>
                      <p className="text-xl font-semibold">
                        {(COND[data.current.code] as Record<string,string>)?.[locale] ?? (COND[data.current.code] as Record<string,string>)?.ru ?? ""}
                      </p>
                      <p className="text-sm text-white/65">
                        {l.feelsLike} {data.current.feelsLike > 0 ? "+" : ""}{data.current.feelsLike}°
                      </p>
                      <p className="mt-2 text-sm text-white/75">
                        <span className="text-white/50">{l.todayFor}:</span>{" "}
                        <span className="font-semibold">{activity(data.current.code, data.current.temp, locale)}</span>
                      </p>
                    </>
                  ) : <Skeleton w="40" h={5} />}
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
                {label:l.uv,        val: data ? String(data.current.uv)        : null},
                {label:l.altitude,  val: "1 050 "+l.masl},
                {label:l.aqi,       val: data ? String(data.aqi)               : null, color: aqi.color},
              ].map(s=>(
                <div key={s.label} className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{s.label}</p>
                  {s.val ? (
                    <p className="mt-0.5 font-bold text-sm" style={s.color?{color:s.color}:{}}>{s.val}</p>
                  ) : <Skeleton w="16" h={4} />}
                </div>
              ))}
            </div>

            {/* 7-day forecast */}
            <div className="mt-4 sm:mt-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/55">{l.forecast}</p>
              <div className="grid grid-cols-7 gap-1 overflow-x-auto">
                {data ? data.daily.map((d,i)=>{
                  const dt = new Date(d.date+"T00:00:00");
                  const isBest = i === bestIdx;
                  return (
                    <div
                      key={d.date}
                      className={`relative rounded-xl px-1 py-2 text-center transition-all ${
                        isBest
                          ? "bg-yellow-400/25 ring-1 ring-yellow-400/60"
                          : i===0 ? "bg-white/18" : "bg-white/8"
                      }`}
                    >
                      {isBest && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-1 text-[7px] font-bold text-yellow-900 whitespace-nowrap">
                          {l.bestBadge}
                        </span>
                      )}
                      <p className="text-[10px] font-bold text-white/60">
                        {i===0 ? l.today : days[dt.getDay()]}
                      </p>
                      <p className="my-1 text-base leading-none">{ICON[d.code]??"🌡"}</p>
                      <p className="text-xs font-bold">+{d.max}°</p>
                      <p className="text-[10px] text-white/50">+{d.min}°</p>
                    </div>
                  );
                }) : Array.from({length:7}).map((_,i)=>(
                  <div key={i} className="rounded-xl bg-white/8 px-1 py-2">
                    <Skeleton h={4} />
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
