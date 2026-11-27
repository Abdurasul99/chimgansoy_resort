"use client";

import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { canvasRatio, flakeSprite, watchActive } from "./canvas";
import { Snowflake } from "./Snowflake";

export type SnowGlobeHandle = { shake: (power?: number) => void };

type Flake = { x: number; y: number; vx: number; vy: number; r: number; phase: number; rest: boolean };

type Props = {
  src: string;
  alt: string;
  shakeLabel: string;
  hintDesk: string;
  hintTouch: string;
  /** Через сколько мс после появления шар встряхнётся сам. */
  autoShakeMs?: number;
  /** Ещё кнопки в ряд с «Встряхнуть» (переключатель гирлянды). */
  extra?: ReactNode;
  ref?: Ref<SnowGlobeHandle>;
};

/**
 * Снежный шар с настоящим вечерним фото курорта.
 *
 * Снег лежит на дне; шар можно тянуть мышью или пальцем (наклоняется за рукой,
 * снег закручивается по скорости движения), встряхнуть кнопкой или самим
 * телефоном. Физика — на холсте, наклон и покачивание — framer-motion.
 *
 * touch-action: pan-y — вертикальный свайп по шару прокручивает страницу:
 * шар на телефоне шириной почти во весь экран, и «прилипшая» к нему прокрутка
 * была бы ловушкой. Встряхивает горизонтальное движение.
 */
export function SnowGlobe({ src, alt, shakeLabel, hintDesk, hintTouch, autoShakeMs = 1300, extra, ref }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<(ix: number, iy: number, power?: number) => void>(() => {});
  const drag = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const motionOn = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const wobble = useAnimationControls();

  const tilt = useMotionValue(0);
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const tiltS = useSpring(tilt, { stiffness: 260, damping: 16 });
  const dxS = useSpring(dx, { stiffness: 260, damping: 18 });
  const dyS = useSpring(dy, { stiffness: 260, damping: 18 });

  // ── Физика снега ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const sprite = flakeSprite();

    let W = 0;
    let R = 0;
    let cx = 0;
    let cy = 0;
    const N = reduced ? 140 : 300;
    const flakes: Flake[] = [];
    let active = true;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = canvasRatio();
      const prevR = R;
      W = Math.max(1, box.width);
      canvas.width = Math.round(W * ratio);
      canvas.height = Math.round(W * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      R = W / 2;
      cx = R;
      cy = R;
      // Шар поменял размер (поворот телефона) — снег масштабируется вместе с ним.
      if (prevR > 0 && prevR !== R) {
        const k = R / prevR;
        for (const f of flakes) {
          f.x *= k;
          f.y *= k;
        }
      }
    };
    resize();

    for (let i = 0; i < N; i++) {
      const a = Math.PI * (0.18 + Math.random() * 0.64);
      const dist = R * (0.78 + Math.random() * 0.16);
      flakes.push({
        x: cx + Math.cos(a) * dist * (0.4 + Math.random() * 0.6),
        y: cy + Math.sin(a) * dist,
        vx: 0,
        vy: 0,
        r: 1 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2,
        rest: true,
      });
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, W, W);
      let moving = 0;
      const terminal = reduced ? 22 : 38;
      for (const f of flakes) {
        if (!f.rest) {
          moving++;
          f.vy += 60 * dt; // тяжесть, как в воде шара
          f.vx *= Math.pow(0.18, dt); // вязкость
          f.vy = f.vy > terminal ? terminal + (f.vy - terminal) * Math.pow(0.05, dt) : f.vy * Math.pow(0.35, dt);
          f.phase += dt * 1.6;
          f.x += (f.vx + Math.sin(f.phase) * 10) * dt;
          f.y += f.vy * dt;
          // Стекло: снег не вылетает за круг.
          const ddx = f.x - cx;
          const ddy = f.y - cy;
          const lim = R - f.r - 3;
          const dist = Math.hypot(ddx, ddy);
          if (dist > lim) {
            const nx = ddx / dist;
            const ny = ddy / dist;
            f.x = cx + nx * lim;
            f.y = cy + ny * lim;
            const dot = f.vx * nx + f.vy * ny;
            f.vx -= 1.6 * dot * nx;
            f.vy -= 1.6 * dot * ny;
            if (ny > 0.55 && Math.abs(f.vy) < 46 && Math.abs(f.vx) < 46) {
              f.rest = true; // улёгся на дно
              f.vx = 0;
              f.vy = 0;
            }
          }
        }
        if (sprite) {
          const s = f.r * 2.4;
          ctx.globalAlpha = f.rest ? 0.75 : 0.95;
          ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      return moving;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const moving = draw(dt);
      if (moving > 0 && active) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf && active) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    shakeRef.current = (ix, iy, power = 1) => {
      const spin = Math.random() < 0.5 ? -1 : 1; // каждое встряхивание крутит воду в свою сторону
      for (const f of flakes) {
        f.rest = false;
        const k = (0.5 + Math.random()) * power;
        const ddx = f.x - cx;
        const ddy = f.y - cy;
        const d = Math.hypot(ddx, ddy) || 1;
        f.vx += (ix * 0.35 + (Math.random() - 0.5) * 520 + (-ddy / d) * 160 * spin) * k;
        f.vy += (iy * 0.35 - 90 - Math.random() * 300 + (ddx / d) * 160 * spin) * k;
      }
      wake();
    };

    draw(0);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { resize(); draw(0); wake(); }) : null;
    ro?.observe(canvas);
    const stopWatch = watchActive(host, (on) => {
      active = on;
      if (on) wake();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      stopWatch();
      shakeRef.current = () => {};
    };
  }, [reduced]);

  const shake = (power = 1.2) => {
    if (!reduced) void wobble.start({ rotate: [0, -9, 8, -5, 0], transition: { duration: 0.7, ease: "easeInOut" } });
    shakeRef.current(0, -600, power);
  };

  useImperativeHandle(ref, () => ({ shake }));

  // Шар сам встряхивается после появления — одна сцена при загрузке.
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => shakeRef.current(0, -500, 1.1), autoShakeMs);
    return () => window.clearTimeout(id);
  }, [reduced, autoShakeMs]);

  // Встряхивание телефона. На iPhone датчик просит разрешение — только по нажатию.
  const listenMotion = () => {
    if (motionOn.current) return;
    let lastShake = 0;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.acceleration ?? e.accelerationIncludingGravity;
      if (!a) return;
      const m = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      const now = Date.now();
      if (m > (e.acceleration ? 14 : 24) && now - lastShake > 350) {
        lastShake = now;
        shakeRef.current((a.x ?? 0) * -40, (a.y ?? 0) * 40, 0.9);
      }
    };
    motionOn.current = handler;
    window.addEventListener("devicemotion", handler);
  };

  useEffect(() => {
    const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (DM && typeof DM.requestPermission !== "function") listenMotion();
    return () => {
      if (motionOn.current) window.removeEventListener("devicemotion", motionOn.current);
      motionOn.current = null;
    };
    // listenMotion читает только ref'ы — подписка одна на всё время жизни шара.
  }, []);

  const onShakeButton = () => {
    shake(1.2);
    const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (DM && typeof DM.requestPermission === "function") {
      DM.requestPermission()
        .then((r) => {
          if (r === "granted") listenMotion();
        })
        .catch(() => {});
    }
  };

  // ── Тянуть шар ─────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const now = performance.now();
    const dt = Math.max(16, now - d.t) / 1000;
    const vx = (e.clientX - d.x) / dt;
    const vy = (e.clientY - d.y) / dt;
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now;
    if (!reduced) {
      tilt.set(Math.max(-14, Math.min(14, vx / 90)));
      dx.set(Math.max(-18, Math.min(18, vx / 60)));
      dy.set(Math.max(-12, Math.min(12, vy / 80)));
    }
    if (Math.hypot(vx, vy) > 280) shakeRef.current(vx, vy, 0.22);
  };
  const release = () => {
    drag.current = null;
    tilt.set(0);
    dx.set(0);
    dy.set(0);
  };

  return (
    <div className="grid justify-items-center gap-4">
      <motion.div
        initial={{ opacity: 0, y: -34, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.45 }}
        className="ny-reveal w-[min(23rem,82vw)] lg:w-[min(31rem,40vw)]"
      >
        <motion.div
          ref={hostRef}
          role="img"
          aria-label={alt}
          style={{ rotate: tiltS, x: dxS, y: dyS, touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") release();
          }}
          className="isolate cursor-grab select-none active:cursor-grabbing"
        >
          <motion.div animate={wobble} style={{ originY: 0.9 }}>
            <div className="relative isolate aspect-square overflow-hidden rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.22),0_0_0_10px_rgba(255,255,255,0.04),0_40px_80px_-30px_rgba(0,0,0,0.9),0_0_120px_-20px_rgba(242,166,90,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- квадратный кадр 1000 px, оптимизатору нечего ужимать */}
              <img src={src} alt="" width={1000} height={1000} className="absolute inset-0 h-full w-full scale-[1.06] object-cover" draggable={false} />
              <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full mix-blend-screen"
                style={{
                  background:
                    "radial-gradient(38% 26% at 30% 20%, rgba(255,255,255,0.42), rgba(255,255,255,0) 70%), radial-gradient(70% 70% at 50% 50%, transparent 62%, rgba(10,20,38,0.55) 100%), radial-gradient(18% 10% at 72% 82%, rgba(255,255,255,0.16), transparent 80%)",
                }}
              />
            </div>
            <div
              aria-hidden="true"
              className="relative z-[-1] mx-auto -mt-6 grid h-[5.2rem] w-[70%] content-end justify-center justify-items-center pb-3 shadow-[inset_0_2px_0_rgba(255,210,122,0.35),0_24px_40px_-18px_rgba(0,0,0,0.9)]"
              style={{
                borderRadius: "0 0 2.2rem 2.2rem / 0 0 1.6rem 1.6rem",
                background: "linear-gradient(180deg, #6b4126 0%, #3b2113 60%, #24140b 100%)",
              }}
            >
              <span className="whitespace-nowrap pl-[0.28em] text-[0.62rem] font-extrabold leading-[1.5] tracking-[0.28em] text-[#ffd27a]/80">CHIMGAN DARBAZA</span>
              <span className="font-serif text-[1.15rem] font-bold italic leading-[1.3] tracking-[0.08em] text-[#ffd27a]/85">2027</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <motion.button
          type="button"
          onClick={onShakeButton}
          whileTap={{ scale: 0.95 }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-[0.88rem] font-bold text-[#eef3fa] transition-colors hover:border-[#ffd27a]"
        >
          <Snowflake className="h-[18px] w-[18px]" />
          {shakeLabel}
        </motion.button>
        {extra}
      </div>
      <p className="m-0 text-center text-[0.82rem] text-[#a6b6cb]">
        <span className="[@media(hover:none)]:hidden">{hintDesk}</span>
        <span className="hidden [@media(hover:none)]:inline">{hintTouch}</span>
      </p>
    </div>
  );
}
