"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { NEW_YEAR_MIDNIGHT_EVENT, newYearCopy } from "@/content/new-year";
import { text } from "@/lib/localize";
import { fitCanvas, watchActive } from "./canvas";
import { MountainLayer } from "./Mountains";

const COLORS = ["#ffd27a", "#ff5d5d", "#58d68d", "#5aa9ff", "#ff8fd1", "#eaf4ff"];

type Rocket = { x0: number; y0: number; x: number; y: number; tx: number; ty: number; t: number; dur: number; color: string };
type Spark = { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; age: number; color: string };

/**
 * «Загадайте желание»: нажатие на небо запускает ракету из-за гор, в точке
 * нажатия — салют. Кнопка делает то же для клавиатуры и экранного диктора.
 * Когда блок впервые показывается, три ракеты взлетают сами; в полночь —
 * залп. Холст рисует, только пока в небе что-то есть.
 */
export function WishSky({ locale, bookHref }: { locale: Locale; bookHref: string }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const launchRef = useRef<(x?: number, y?: number) => void>(() => {});

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    let W = 0;
    let H = 0;
    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const flashes: { x: number; y: number; age: number; color: string }[] = [];
    let raf = 0;
    let active = true;
    let last = performance.now();
    let clearTimer = 0;
    const small = window.innerWidth < 640;

    const resize = () => {
      ({ w: W, h: H } = fitCanvas(canvas, ctx));
    };
    resize();

    const burst = (x: number, y: number, color: string) => {
      const n = small ? 60 : 96;
      const second = COLORS[(COLORS.indexOf(color) + 2) % COLORS.length];
      // Разлёт — от размера неба: на телефоне шар салюта не шире экрана.
      const reach = Math.min(1, W / 900);
      flashes.push({ x, y, age: 0, color });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        const sp = (150 + Math.random() * 230) * (0.6 + 0.4 * reach);
        sparks.push({
          x,
          y,
          px: x,
          py: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1.3 + Math.random() * 0.8,
          age: 0,
          color: i % 4 === 0 ? second : color,
        });
      }
      if (sparks.length > 900) sparks.splice(0, sparks.length - 900);
    };

    // «Уменьшить движение»: салют без полёта — неподвижная вспышка, которая гаснет.
    const staticBurst = (x: number, y: number, color: string) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      for (let ring = 1; ring <= 3; ring++) {
        const r = ring * 28;
        const n = 12 * ring;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.globalAlpha = 1 - ring * 0.22;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => ctx.clearRect(0, 0, W, H), 1400);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt;
        const k = Math.min(1, r.t / r.dur);
        const e = 1 - Math.pow(1 - k, 3);
        const px = r.x;
        const py = r.y;
        r.x = r.x0 + (r.tx - r.x0) * e;
        r.y = r.y0 + (r.ty - r.y0) * e;
        ctx.strokeStyle = "rgba(255,226,168,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py + 10);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
        if (k >= 1) {
          rockets.splice(i, 1);
          burst(r.x, r.y, r.color);
        }
      }

      // Вспышка в момент разрыва — короткое тёплое свечение.
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.age += dt;
        const k = 1 - f.age / 0.35;
        if (k <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 90);
        g.addColorStop(0, f.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.55 * k;
        ctx.fillStyle = g;
        ctx.fillRect(f.x - 90, f.y - 90, 180, 180);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) {
          sparks.splice(i, 1);
          continue;
        }
        s.px = s.x;
        s.py = s.y;
        s.vx *= Math.pow(0.5, dt);
        s.vy = s.vy * Math.pow(0.5, dt) + 60 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const fade = 1 - s.age / s.life;
        ctx.globalAlpha = fade;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(s.px, s.py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        // Искра на конце хвоста.
        if (fade > 0.35) {
          ctx.fillStyle = "#fff7e6";
          ctx.fillRect(s.x - 0.8, s.y - 0.8, 1.6, 1.6);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if ((rockets.length || sparks.length || flashes.length) && active) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf && active) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    launchRef.current = (x, y) => {
      const tx = x ?? W * (0.2 + Math.random() * 0.6);
      const ty = Math.min(y ?? H * (0.15 + Math.random() * 0.3), H * 0.75);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (reduced) {
        staticBurst(tx, ty, color);
        return;
      }
      const x0 = tx + (Math.random() - 0.5) * 80;
      rockets.push({ x0, y0: H + 10, x: x0, y: H + 10, tx, ty, t: 0, dur: 0.75 + Math.random() * 0.25, color });
      wake();
    };

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const stopWatch = watchActive(section, (on) => {
      active = on;
      if (!on) {
        rockets.length = 0;
        sparks.length = 0;
        flashes.length = 0;
        ctx.clearRect(0, 0, W, H);
      }
    });

    // Первый показ блока — три ракеты сами, одна за другой.
    let volleyTimers: number[] = [];
    let io: IntersectionObserver | null = null;
    if (!reduced && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          io?.disconnect();
          volleyTimers = [0, 380, 760].map((ms, i) =>
            window.setTimeout(() => launchRef.current(W * (0.28 + i * 0.22), H * (0.2 + (i % 2) * 0.1)), ms),
          );
        },
        { threshold: 0.45 },
      );
      io.observe(section);
    }

    const onMidnight = () => {
      [0, 250, 500, 750, 1000, 1250].forEach((ms) => volleyTimers.push(window.setTimeout(() => launchRef.current(), ms)));
    };
    window.addEventListener(NEW_YEAR_MIDNIGHT_EVENT, onMidnight);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(clearTimer);
      volleyTimers.forEach((t) => window.clearTimeout(t));
      io?.disconnect();
      ro?.disconnect();
      stopWatch();
      window.removeEventListener(NEW_YEAR_MIDNIGHT_EVENT, onMidnight);
      launchRef.current = () => {};
    };
  }, [reduced]);

  const onSky = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as Element).closest("a, button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    launchRef.current(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <section
      ref={sectionRef}
      onPointerDown={onSky}
      aria-labelledby="ny-wish-title"
      className="relative isolate flex min-h-[78svh] cursor-pointer flex-col overflow-hidden bg-[linear-gradient(180deg,#0b1424_0%,#101e36_55%,#0d1829_100%)] text-center text-[#eef3fa]"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" />

      <div className="relative z-[1] mx-auto w-full max-w-2xl px-4 pt-24 sm:px-6 sm:pt-28">
        <motion.h2
          id="ny-wish-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="ny-reveal m-0 font-serif text-[clamp(2.4rem,7vw,4rem)] font-bold italic leading-none"
        >
          {text(newYearCopy.wishTitle, locale)}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="ny-reveal mx-auto mb-0 mt-4 max-w-md text-[1.04rem] leading-relaxed text-[#eef3fa]/80"
        >
          {text(newYearCopy.wishText, locale)}
        </motion.p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => launchRef.current()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-5 text-[0.95rem] font-bold text-[#eef3fa] transition-colors hover:border-[#ffd27a]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
            </svg>
            {text(newYearCopy.wishButton, locale)}
          </motion.button>
          <a
            href={bookHref}
            className="btn-press inline-flex min-h-12 items-center rounded-full bg-[#ffd27a] px-6 text-[0.95rem] font-extrabold text-[#2a1a05] shadow-[0_14px_36px_-14px_rgba(255,210,122,0.9)] transition-colors hover:bg-[#ffe0a0]"
          >
            {text(newYearCopy.book, locale)}
          </a>
        </div>
      </div>

      {/* Горы впереди салюта: ракеты взлетают из-за хребта. */}
      <div aria-hidden="true" className="pointer-events-none relative z-[2] mt-auto h-[max(34vh,26vw)] min-h-[200px] max-h-[420px]">
        <MountainLayer layer="far" className="opacity-80" />
        <MountainLayer layer="mid" />
        <MountainLayer layer="near" />
      </div>
    </section>
  );
}
