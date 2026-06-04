"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

type ScrollExpandMediaProps = {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
};

export function ScrollExpandMedia({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Expansion completes in the first 65% of scrub — last 35% reveals children
  const expand = useTransform(scrollYProgress, [0, 0.65], [0, 1], { clamp: true });
  useMotionValueEvent(expand, "change", (v) => setProgress(v));

  const mediaWidth = 320 + progress * (isMobile ? 600 : 1200);
  const mediaHeight = 420 + progress * (isMobile ? 220 : 380);
  const showContent = progress >= 0.95;
  const hintOpacity = Math.max(0, 1 - progress * 1.8);
  // Title fades out cleanly before the media covers it
  const titleOpacity = Math.max(0, 1 - progress * 2.4);

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-hidden"
      style={{ height: "220vh" }}
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        {/* Background — fades as user expands the media */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: 1 - progress * 0.92 }}
        >
          <Image
            src={bgImageSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        {/* Centered stage */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {/* Title — single centered block, fades out as media takes over */}
          {title && (
            <div
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center ${
                textBlend ? "mix-blend-difference" : ""
              }`}
              style={{ opacity: titleOpacity }}
            >
              <h2 className="max-w-3xl font-serif text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] md:text-5xl lg:text-6xl">
                {title}
              </h2>
            </div>
          )}

          {/* Expanding media frame */}
          <div
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
            style={{
              width: `${mediaWidth}px`,
              height: `${mediaHeight}px`,
              maxWidth: "95vw",
              maxHeight: "85vh",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            {mediaType === "image" ? (
              <Image
                src={mediaSrc}
                alt={title ?? ""}
                fill
                sizes="(max-width: 768px) 95vw, 90vw"
                className="object-cover"
              />
            ) : (
              <video
                src={mediaSrc}
                poster={posterSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover"
                controls={false}
              />
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-black/50"
              style={{ opacity: 0.6 - progress * 0.45 }}
            />

            {/* Scroll hint — visible at the start, fades as expansion progresses */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-center"
              style={{ opacity: hintOpacity }}
            >
              {date && (
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                  {date}
                </p>
              )}
              {scrollToExpand && (
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                  <span>{scrollToExpand}</span>
                  <span
                    aria-hidden
                    className="inline-block h-4 w-px bg-white/60"
                    style={{ animation: "bounce-y 2s ease-in-out infinite" }}
                  />
                </p>
              )}
            </div>
          </div>

          {/* Children — appear once media is fully expanded, overlaid above */}
          {children && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6"
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="pointer-events-auto w-full max-w-4xl">{children}</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScrollExpandMedia;
