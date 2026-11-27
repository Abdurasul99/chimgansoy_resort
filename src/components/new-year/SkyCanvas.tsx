"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fitCanvas, flakeSprite, watchActive } from "./canvas";

type Star = { x: number; y: number; r: number; a: number; s: number; p: number };
type Flake = { x: number; y: number; r: number; v: number; p: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; age: number };

/**
 * Ночное небо первого экрана: мерцающие звёзды, редкая падающая звезда и снег,
 * который сносит ветром вслед за мышью. Один холст, один цикл кадров; стоит,
 * пока небо не на экране. С «уменьшить движение» — неподвижные звёзды без снега.
 */
export function SkyCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const sprite = flakeSprite();

    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let flakes: Flake[] = [];
    let meteor: Meteor | null = null;
    let nextMeteor = 4 + Math.random() * 5;
    let wind = 0;
    let targetWind = 0;
    let lastX: number | null = null;
    let raf = 0;
    let active = true;
    let last = performance.now();
    let t = 0;

    const build = () => {
      ({ w: W, h: H } = fitCanvas(canvas, ctx));
      const nStars = Math.min(170, Math.round((W * H) / 7000));
      stars = Array.from({ length: nStars }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() < 0.12 ? 1.3 + Math.random() * 0.8 : 0.45 + Math.random() * 0.75,
        a: 0.35 + Math.random() * 0.6,
        s: 0.6 + Math.random() * 1.8,
        p: Math.random() * Math.PI * 2,
      }));
      const nFlakes = reduced ? 0 : Math.min(110, Math.round(W / 13));
      flakes = Array.from({ length: nFlakes }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 2.2,
        v: 16 + Math.random() * 36,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (dt: number) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#ffffff";
      for (const s of stars) {
        ctx.globalAlpha = reduced ? s.a : s.a * (0.62 + 0.38 * Math.sin(t * s.s + s.p));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        nextMeteor -= dt;
        if (!meteor && nextMeteor <= 0) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          meteor = {
            x: W * (0.2 + Math.random() * 0.6),
            y: H * (0.05 + Math.random() * 0.2),
            vx: dir * (520 + Math.random() * 260),
            vy: 200 + Math.random() * 120,
            life: 0.9,
            age: 0,
          };
          nextMeteor = 7 + Math.random() * 6;
        }
        if (meteor) {
          meteor.age += dt;
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          const k = 1 - meteor.age / meteor.life;
          if (k <= 0) {
            meteor = null;
          } else {
            const tail = 0.12;
            const grad = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
            grad.addColorStop(0, `rgba(255,240,214,${0.95 * k})`);
            grad.addColorStop(1, "rgba(255,240,214,0)");
            ctx.globalAlpha = 1;
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
            ctx.stroke();
          }
        }

        wind += (targetWind - wind) * Math.min(1, dt * 2);
        targetWind *= Math.pow(0.3, dt);
        if (sprite) {
          for (const f of flakes) {
            f.p += dt;
            f.y += f.v * dt;
            f.x += (Math.sin(f.p) * 12 + wind * (f.r / 2)) * dt;
            if (f.y > H + 6) {
              f.y = -6;
              f.x = Math.random() * W;
            }
            if (f.x > W + 6) f.x = -6;
            if (f.x < -6) f.x = W + 6;
            const size = f.r * 2.6;
            ctx.globalAlpha = 0.35 + f.r / 6;
            ctx.drawImage(sprite, f.x - size / 2, f.y - size / 2, size, size);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      if (active && !reduced) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduced) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    build();
    draw(0);
    start();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { build(); draw(0); }) : null;
    ro?.observe(canvas);

    const stopWatch = watchActive(canvas, (on) => {
      active = on;
      if (on) start();
    });

    const onMove = (e: PointerEvent) => {
      if (lastX !== null) targetWind = Math.max(-120, Math.min(120, (e.clientX - lastX) * 6));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      stopWatch();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
