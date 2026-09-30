"use client";

import { useEffect, useState } from "react";
import { onScrollFrame } from "@/lib/scroll-engine";

/**
 * Кнопка брони, прилипшая к низу экрана на телефоне.
 *
 * На странице домика форма «Забронировать в один клик» стоит после описания,
 * удобств и правил — на телефоне это пять-шесть экранов листания. Кнопка
 * появляется, когда гость ушёл с первого экрана, и прячется, как только форма
 * показалась: две кнопки брони на одном экране — лишняя.
 *
 * Стоит ниже «Консьержа» (тот на 72 px от низа) и не перекрывает его.
 */
export function StickyFormCta({ targetId, label }: { targetId: string; label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    return onScrollFrame(({ y }) => {
      const target = document.getElementById(targetId);
      const formAhead = target ? target.getBoundingClientRect().top > window.innerHeight * 0.85 : false;
      setShow(y > window.innerHeight * 0.6 && formAhead);
    });
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`btn-press fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-5 text-[15px] font-extrabold text-[var(--on-accent)] shadow-[0_14px_36px_-10px_rgba(0,0,0,0.45)] transition-all duration-300 lg:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {label}
      <span aria-hidden>→</span>
    </a>
  );
}
