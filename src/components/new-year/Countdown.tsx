// Без "use client": отсчёт живёт внутри клиентской сцены (NewYearScene), а у
// точки входа клиента проп-функция onMidnight была бы запрещена.
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { countdownParts, unitLabel, type CountdownUnit } from "@/content/new-year";

const UNITS: CountdownUnit[] = ["d", "h", "m", "s"];

// Часы для отсчёта: секунда как снимок внешнего состояния. На сервере и при
// гидратации — null (разметка без цифр), сразу после — настоящее время. Так
// цифры не расходятся между сервером и браузером.
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 250);
  return () => window.clearInterval(id);
};
const nowSecond = () => Math.floor(Date.now() / 1000);
const serverSecond = () => null;

/** Одна цифра: старая уезжает вниз, новая падает сверху. */
function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.64em] overflow-hidden align-top">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="absolute inset-0 flex justify-center"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Отсчёт до полуночи по Ташкенту. В полночь вместо цифр — поздравление, и
 * сцена получает onMidnight (шар встряхивается, в небе салют).
 */
export function Countdown({
  locale,
  label,
  happy,
  onMidnight,
}: {
  locale: Locale;
  label: string;
  happy: string;
  onMidnight?: () => void;
}) {
  const sec = useSyncExternalStore(subscribe, nowSecond, serverSecond);
  const parts = sec === null ? undefined : countdownParts(sec * 1000);
  const wasCounting = useRef(false);

  useEffect(() => {
    if (parts) wasCounting.current = true;
    // Праздник — только если гость застал саму полночь на этой странице.
    if (parts === null && wasCounting.current) {
      wasCounting.current = false;
      onMidnight?.();
    }
  }, [parts, onMidnight]);

  if (parts === null) {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 12 }}
        className="m-0 font-serif text-[2.2rem] font-bold italic leading-tight text-[#ffd27a]"
      >
        {happy}
      </motion.p>
    );
  }

  return (
    <div>
      <p className="m-0 mb-2.5 text-[0.9rem] text-[#a6b6cb]">{label}</p>
      <ol
        className="m-0 grid list-none grid-cols-4 gap-2 p-0 sm:max-w-[22rem] sm:gap-2.5"
        aria-live="off"
        // Пока не знаем времени — ячейки на месте, но пустые: высота блока не прыгает.
        aria-hidden={parts === undefined ? true : undefined}
      >
        {UNITS.map((u) => {
          const n = parts?.[u] ?? 0;
          const v = parts ? (u === "d" ? String(n) : String(n).padStart(2, "0")) : "";
          return (
            <li
              key={u}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-1 pb-2.5 pt-3 text-center backdrop-blur-[2px]"
            >
              <b className="block text-[clamp(1.6rem,6vw,2.2rem)] font-extrabold leading-none text-white [font-variant-numeric:tabular-nums]">
                {parts ? (
                  v.split("").map((ch, i) => <Digit key={`${u}-${v.length - i}`} value={ch} />)
                ) : (
                  <span className="inline-block h-[1em]" />
                )}
              </b>
              <span className="mt-1.5 block text-[0.72rem] text-[#a6b6cb]">{parts ? unitLabel(locale, u, n) : " "}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
