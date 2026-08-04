"use client";

/**
 * Shared scroll engine.
 *
 * One rAF loop owns everything that reacts to scrolling, so the page never runs
 * more than a single scroll-driven frame callback:
 *
 *   1. publishes `--scroll-progress` (0→1) onto the reading-progress rail
 *   2. drives `[data-parallax]` elements
 *   3. drives the hero scroll-out
 *   4. notifies subscribers (Header direction, ScrollObserver's jump guard)
 *
 * Every write is de-duplicated against the last value and rounded to whole
 * pixels, and custom properties are set on the consuming element rather than on
 * <html> — a root-level custom property invalidates computed style for the
 * whole document on every frame.
 *
 * The loop is idle by default: it only spins while the page is actually moving,
 * then parks itself. That matters because Lenis emits a scroll event on every
 * animation frame (not just on real input) — anything doing per-event DOM work
 * would otherwise burn a frame budget on a 13 000px page.
 *
 * `translate:` (not `transform:`) is used for parallax on purpose — it is an
 * independent CSS property, so it composes with Tailwind's `scale-*` /
 * `-translate-x-*` transform utilities instead of overwriting them.
 */

import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

type Subscriber = (state: { y: number; velocity: number; progress: number }) => void;

const subscribers = new Set<Subscriber>();
const parallaxNodes = new Set<HTMLElement>();

let rafId = 0;
let idleFrames = 0;
let lastY = -1;
let smoothVelocity = 0;
let parallaxObserver: IntersectionObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let started = false;
let listenerCount = 0;

/** Elements currently near the viewport get their parallax updated; the rest are skipped. */
function ensureParallaxObserver() {
  if (parallaxObserver || typeof IntersectionObserver === "undefined") return;
  parallaxObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          parallaxNodes.add(el);
        } else {
          parallaxNodes.delete(el);
          el.style.setProperty("--parallax-y", "0px");
        }
      }
      if (parallaxNodes.size) wake();
    },
    // Generous margin so an element is already in position before it appears.
    { rootMargin: "20% 0px 20% 0px" },
  );
}

function scanParallax() {
  ensureParallaxObserver();
  if (!parallaxObserver) return;
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    if (el.dataset.parallaxBound === "1") return;
    el.dataset.parallaxBound = "1";
    parallaxObserver!.observe(el);
  });
}

/**
 * Coalesces scan requests to one per frame. The MutationObserver fires on every
 * DOM change — the hero slideshow alone re-renders every 5.5s — and each scan is
 * a full-document query.
 */
let scanQueued = false;
function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  requestAnimationFrame(() => {
    scanQueued = false;
    scanParallax();
  });
}

/** Drops the cached style targets. Called when the page itself changes. */
function resetTargets() {
  progressEls = undefined;
  lastProgress = "";
}

/**
 * Parallax, split read-then-write.
 *
 * Interleaving `getBoundingClientRect()` with `style.setProperty()` thrashes:
 * every write dirties style, and the next read forces a synchronous style +
 * layout recalc. Reading every rect first and only then writing keeps it to one
 * recalc per frame regardless of how many elements are on screen.
 */
const rectBuf: { el: HTMLElement; y: number }[] = [];

function updateParallax(vh: number) {
  if (!parallaxNodes.size) return;
  // Below 1024px globals.css pins these to `translate: none !important`, so
  // every rect read and property write here would be work with no pixel to
  // show for it — on the one class of device that reported the page feeling
  // busy. Re-armed by the resize listener when a window grows past 1024.
  if (window.innerWidth < 1024) return;
  rectBuf.length = 0;

  for (const el of parallaxNodes) {
    const speed = parseFloat(el.dataset.parallax || "0");
    if (!speed) continue;
    const rect = el.getBoundingClientRect(); // READ
    // -1 when the element's centre sits a viewport below the fold,
    //  0 when it is centred, +1 when a viewport above.
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    rectBuf.push({ el, y: progress * speed * vh });
  }

  for (const { el, y } of rectBuf) {
    // Whole pixels: sub-pixel churn re-styles the element every frame for a
    // change nobody can see.
    const next = `${Math.round(y)}px`;
    if (el.dataset.parallaxLast === next) continue;
    el.dataset.parallaxLast = next;
    el.style.setProperty("--parallax-y", next); // WRITE
  }
}

/* The hero scroll-out lived here — it wrote --hero-shift / --hero-fade /
   --hero-media onto [data-hero-fx] so the first screen dissolved as it left.
   Removed 2026-08-04 at the operator's request: the media lag bared the
   section's dark base into a black band, and the fade emptied the hero while
   it was still on screen. See the note in globals.css. */

/**
 * Style targets for scroll progress: the top hairline and the tick rail.
 *
 * Written on the elements that consume it, NOT on <html>. A custom property set
 * on the root element invalidates computed style for the entire document —
 * every frame, on a page with thousands of nodes.
 */
const PROGRESS_TARGETS = ".scroll-progress, .scroll-ticks";
let progressEls: HTMLElement[] | undefined;
let lastProgress = "";

function publish(progress: number) {
  // Re-query if the list is empty or React swapped the nodes out from under us
  // (an `isConnected` check per frame is free; a stale node reference is not).
  if (progressEls === undefined || progressEls.length === 0 || !progressEls[0].isConnected) {
    progressEls = Array.from(document.querySelectorAll<HTMLElement>(PROGRESS_TARGETS));
  }
  if (progressEls.length === 0) return;
  // 3 decimals is ~1px of travel on a 1440px bar — finer than anyone can see.
  const p = progress.toFixed(3);
  if (p === lastProgress) return;
  lastProgress = p;
  for (const el of progressEls) el.style.setProperty("--scroll-progress", p);
}

function frame() {
  rafId = 0;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const limit = Math.max(1, document.documentElement.scrollHeight - vh);

  const delta = lastY < 0 ? 0 : y - lastY;
  lastY = y;

  // Normalised, eased velocity: ±1 is "a viewport per ~4 frames". Smoothing it
  // here means consumers get a value that decays instead of snapping to 0.
  const raw = Math.max(-1, Math.min(1, delta / (vh * 0.25)));
  smoothVelocity += (raw - smoothVelocity) * 0.18;
  if (Math.abs(smoothVelocity) < 0.0015) smoothVelocity = 0;

  const progress = Math.min(1, Math.max(0, y / limit));

  publish(progress);
  updateParallax(vh);

  if (subscribers.size) {
    const state = { y, velocity: smoothVelocity, progress };
    for (const fn of subscribers) fn(state);
  }

  // Park the loop once everything has settled, so an idle tab costs nothing.
  if (delta === 0 && smoothVelocity === 0) {
    idleFrames += 1;
  } else {
    idleFrames = 0;
  }
  if (idleFrames < 6) rafId = requestAnimationFrame(frame);
}

function wake() {
  idleFrames = 0;
  if (!rafId) rafId = requestAnimationFrame(frame);
}

/**
 * Arms the window listeners that wake the loop. Reference-counted, so a
 * subscriber and the engine itself can each hold it independently.
 *
 * Subscribing is enough to arm this — `onScrollFrame` consumers (the Header)
 * must not silently go dead just because <SmoothScroll> happens not to be
 * mounted alongside them.
 */
function armListeners(): () => void {
  if (listenerCount === 0) {
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    window.addEventListener("orientationchange", wake);
  }
  listenerCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    listenerCount -= 1;
    if (listenerCount === 0) {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      window.removeEventListener("orientationchange", wake);
    }
  };
}

/** Boots the shared loop. Safe to call repeatedly — only the first call sets up. */
export function startScrollEngine(): () => void {
  const releaseListeners = armListeners();
  // Each call means a new page: the hero, the progress rail and the marquee
  // strips may all be different elements now.
  resetTargets();

  if (started) {
    scanParallax();
    wake();
    return releaseListeners;
  }
  started = true;

  scanParallax();

  // React can mount sections after the first scan (hydration, route change),
  // so watch for new [data-parallax] nodes instead of assuming a static DOM.
  mutationObserver = new MutationObserver(queueScan);
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  wake();

  return () => {
    started = false;
    releaseListeners();
    mutationObserver?.disconnect();
    mutationObserver = null;
    parallaxObserver?.disconnect();
    parallaxObserver = null;
    parallaxNodes.clear();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastY = -1;
    smoothVelocity = 0;
  };
}

/** Subscribe to the shared loop. Returns an unsubscribe fn. */
export function onScrollFrame(fn: Subscriber): () => void {
  subscribers.add(fn);
  const releaseListeners = armListeners();
  wake();
  return () => {
    subscribers.delete(fn);
    releaseListeners();
  };
}

/** Nudge the loop awake — used after programmatic scrolls and layout changes. */
export { wake as pokeScrollEngine };
