"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export type StayCard = {
  href: string;
  img: { src: string; srcSet?: string; sizes?: string };
  position: string;
  name: string;
  text: string;
};

/**
 * Карточка наклоняется за мышью, по стеклу бежит морозный блик. Только для
 * мыши: на телефоне наклон от пальца мешал бы прокрутке и выглядел бы сбоем.
 */
function Card({ card, more, index }: { card: StayCard; more: string; index: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const rxS = useSpring(rx, { stiffness: 200, damping: 20 });
  const ryS = useSpring(ry, { stiffness: 200, damping: 20 });
  const glint = useMotionTemplate`radial-gradient(260px circle at ${mx}% ${my}%, rgba(255,255,255,0.16), transparent 62%)`;

  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || reduced) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 8);
    mx.set(px * 100);
    my.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="ny-reveal"
      style={{ perspective: 900 }}
    >
      <motion.a
        ref={ref}
        href={card.href}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rxS, rotateY: ryS }}
        className="group relative block aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-[#13233b] text-left shadow-[0_30px_60px_-36px_rgba(0,0,0,0.9)] outline-offset-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- srcset из оптимизатора, как в каталоге домиков */}
        <img
          {...card.img}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{ objectPosition: card.position }}
        />
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glint }} />
        <span className="absolute inset-x-0 bottom-0 grid gap-1.5 bg-[linear-gradient(0deg,rgba(6,12,22,0.94),rgba(6,12,22,0.55)_60%,transparent)] px-5 pb-5 pt-20">
          <span className="font-serif text-[2rem] font-bold italic leading-[1.05] text-white">{card.name}</span>
          <span className="text-[0.92rem] leading-snug text-[#eef3fa]/80">{card.text}</span>
          <span className="mt-1 text-[0.85rem] font-bold text-[#ffd27a] underline decoration-[#ffd27a]/45 underline-offset-4">{more}</span>
        </span>
      </motion.a>
    </motion.li>
  );
}

export function StayCards({ title, lead, more, cards }: { title: string; lead: string; more: string; cards: StayCard[] }) {
  return (
    <section aria-labelledby="ny-stays-title" className="relative bg-[#0b1424] text-[#eef3fa]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <motion.h2
          id="ny-stays-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="ny-reveal m-0 font-serif text-[clamp(2.2rem,6vw,3.4rem)] font-bold italic leading-none"
        >
          {title}
        </motion.h2>
        <p className="mb-0 mt-4 max-w-xl text-[1rem] leading-relaxed text-[#a6b6cb]">{lead}</p>
        <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3 sm:gap-5">
          {cards.map((card, i) => (
            <Card key={card.href} card={card} more={more} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
