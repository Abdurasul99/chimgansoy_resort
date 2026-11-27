"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { Locale } from "@/i18n/config";
import { NEW_YEAR_MIDNIGHT_EVENT, NEW_YEAR_READY_EVENT, newYearCopy } from "@/content/new-year";
import { text } from "@/lib/localize";
import { SkyCanvas } from "./SkyCanvas";
import { MountainLayer, type MountainLayerName } from "./Mountains";
import { Garland } from "./Garland";
import { Countdown } from "./Countdown";
import { SnowGlobe, type SnowGlobeHandle } from "./SnowGlobe";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Заголовок падает буквами, как снег, и ложится на место. Слова не рвутся
 * посередине (каждое — неразрывный блок), экранный диктор читает фразу целиком
 * из aria-label, а поисковик — тот же текст, что в разметке.
 */
function FallingTitle({ value }: { value: string }) {
  const words = value.split(" ");
  let n = 0;
  return (
    <h1 aria-label={value} className="ny-title m-0 text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
      {words.map((word, wi) => (
        <span key={wi}>
          {wi > 0 && " "}
          <span aria-hidden="true" className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, ci) => {
              const i = n++;
              return (
                <motion.span
                  key={ci}
                  className="ny-reveal inline-block"
                  initial={{ opacity: 0, y: "-0.6em", rotate: (i % 2 ? 1 : -1) * (4 + ((i * 7) % 6)) }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.035, type: "spring", stiffness: 220, damping: 16 }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
        </span>
      ))}
    </h1>
  );
}

/** Слой гор со сдвигом от мыши (x) и прокрутки (y). */
function Layer({ layer, x, y, delay }: { layer: MountainLayerName; x: MotionValue<number>; y: MotionValue<number>; delay: number }) {
  return (
    <motion.div
      className="ny-reveal absolute inset-y-0 -left-10 -right-10"
      style={{ x, y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <MountainLayer layer={layer} />
    </motion.div>
  );
}

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

export function NewYearScene({
  locale,
  globeSrc,
  bookHref,
  phone,
}: {
  locale: Locale;
  globeSrc: string;
  bookHref: string;
  /** Номер для кнопки «Позвонить», как его пишут на сайте: +998 50 154 00 44. */
  phone: string;
}) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const globeRef = useRef<SnowGlobeHandle>(null);
  const [wave, setWave] = useState(0);

  // Экран на месте — занавес перехода из шапки можно поднимать.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event(NEW_YEAR_READY_EVENT)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Параллакс: мышь сдвигает слои по горизонтали, прокрутка — по вертикали.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pxS = useSpring(px, { stiffness: 60, damping: 18 });
  const pyS = useSpring(py, { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const starsX = useTransform(pxS, (v) => v * -6);
  const starsY = useTransform(pyS, (v) => v * -4);
  const farX = useTransform(pxS, (v) => v * -10);
  const midX = useTransform(pxS, (v) => v * -18);
  const nearX = useTransform(pxS, (v) => v * -28);
  // «Уменьшить движение» гасит и прокрутку слоёв — через множитель, а не
  // условием в разметке: иначе стиль на сервере и в браузере расходится.
  const k = useMotionValue(1);
  useEffect(() => {
    k.set(reduced ? 0 : 1);
  }, [reduced, k]);
  const farY = useTransform(() => scrollYProgress.get() * 18 * k.get());
  const midY = useTransform(() => scrollYProgress.get() * 36 * k.get());
  const nearY = useTransform(() => scrollYProgress.get() * 64 * k.get());
  const textY = useTransform(() => scrollYProgress.get() * -48 * k.get());
  const textOpacity = useTransform(() => 1 - Math.min(1, scrollYProgress.get() / 0.85) * 0.8 * k.get());

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || reduced) return;
    px.set((e.clientX / window.innerWidth - 0.5) * 2);
    py.set((e.clientY / window.innerHeight - 0.5) * 2);
  };

  const onMidnight = () => {
    globeRef.current?.shake(1.6);
    window.dispatchEvent(new Event(NEW_YEAR_MIDNIGHT_EVENT));
  };

  const lightsButton = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={() => setWave((w) => w + 1)}
      aria-label={text(newYearCopy.lights, locale)}
      title={text(newYearCopy.lights, locale)}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/5 text-[#ffd27a] transition-colors hover:border-[#ffd27a]"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
      </svg>
    </motion.button>
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={heroRef}
        onPointerMove={onPointerMove}
        className="relative isolate -mt-[4.5rem] flex min-h-[100svh] items-center overflow-hidden text-[#eef3fa]"
        style={{
          background:
            "radial-gradient(70rem 30rem at 70% 105%, rgba(242,166,90,0.22), transparent 70%), radial-gradient(40rem 22rem at 10% 10%, rgba(80,120,190,0.18), transparent 70%), linear-gradient(180deg, #08111f 0%, #0c1626 40%, #13233b 100%)",
        }}
      >
        <motion.div
          className="absolute -inset-4 -z-10"
          style={{ x: starsX, y: starsY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <SkyCanvas className="absolute inset-0 h-full w-full" />
        </motion.div>

        {/* Высота от ширины тоже: слой обрезается сверху (xMidYMax slice), и на
            широком экране вершина Чимгана иначе уходит за край. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[max(40vh,26vw)] max-h-[440px] min-h-[220px]">
          <Layer layer="far" x={farX} y={farY} delay={0.15} />
          <Layer layer="mid" x={midX} y={midY} delay={0.3} />
          <Layer layer="near" x={nearX} y={nearY} delay={0.45} />
        </div>

        <Garland wave={wave} />

        <div className="relative z-[3] mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-24 pt-[8.5rem] sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:px-8 lg:pb-28 lg:pt-36">
          {/* На телефоне колонка «растворяется» (display: contents), и шар
              встаёт между текстом и отсчётом; с 1024 px — две колонки. */}
          <motion.div className="contents lg:block" style={{ y: textY, opacity: textOpacity }}>
            <div className="order-1 min-w-0">
              <FallingTitle value={text(newYearCopy.title, locale)} />
            </div>
            <motion.p {...reveal(1.0)} className="ny-reveal order-2 m-0 max-w-lg text-[1.06rem] leading-relaxed text-[#eef3fa]/82 lg:mt-5">
              {text(newYearCopy.lead, locale)}
            </motion.p>
            <motion.div {...reveal(1.15)} className="ny-reveal order-4 min-w-0 lg:mt-8">
              <Countdown
                locale={locale}
                label={text(newYearCopy.until, locale)}
                happy={text(newYearCopy.happy, locale)}
                onMidnight={onMidnight}
              />
            </motion.div>
            <motion.div {...reveal(1.3)} className="ny-reveal order-5 flex flex-wrap gap-3 lg:mt-8">
              <a
                href={bookHref}
                className="btn-press inline-flex min-h-[3.1rem] items-center justify-center rounded-full bg-[#ffd27a] px-6 text-[0.95rem] font-extrabold text-[#2a1a05] shadow-[0_14px_36px_-14px_rgba(255,210,122,0.9)] transition-colors hover:bg-[#ffe0a0]"
              >
                {text(newYearCopy.book, locale)}
              </a>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="btn-press inline-flex min-h-[3.1rem] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-5 text-[0.95rem] font-bold text-[#eef3fa] transition-colors hover:bg-white/[0.12]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
                {text(newYearCopy.call, locale)}
              </a>
            </motion.div>
          </motion.div>

          <div className="order-3 min-w-0 lg:order-none">
            <SnowGlobe
              ref={globeRef}
              src={globeSrc}
              alt={text(newYearCopy.globeAlt, locale)}
              shakeLabel={text(newYearCopy.shake, locale)}
              hintDesk={text(newYearCopy.hintDesk, locale)}
              hintTouch={text(newYearCopy.hintTouch, locale)}
              extra={lightsButton}
            />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
