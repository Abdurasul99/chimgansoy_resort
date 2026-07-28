"use client";

// Body scroll-lock helper with reference counting and iOS-safe behavior.
// Multiple components can lock concurrently — body is only released when
// every locker has called unlock(). Used by the LogoIntro overlay and the
// Header mobile-drawer; they must not clobber each other.

let lockCount = 0;
let savedCssText = "";
let savedScrollY = 0;

export function lock(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedCssText = document.body.style.cssText;
    // iOS Safari requires position:fixed to actually stop body scroll.
    document.body.style.cssText +=
      `;position:fixed;top:-${savedScrollY}px;left:0;right:0;width:100%;overflow:hidden;`;
    // Smooth scrolling has to stand down too, otherwise it keeps easing towards
    // a target while the body is pinned — and lands somewhere else on release.
    window.__lenis?.stop();
  }
  lockCount += 1;
}

export function unlock(): void {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.cssText = savedCssText;
    window.scrollTo(0, savedScrollY);
    // The document height was collapsed while pinned; re-measure before handing
    // control back, then snap (not animate) to where the user actually was.
    const lenis = window.__lenis;
    if (lenis) {
      lenis.resize();
      lenis.start();
      lenis.scrollTo(savedScrollY, { immediate: true, force: true });
    }
  }
}

// Test/debug only — never call from production code.
export function _resetLock(): void {
  lockCount = 0;
  savedCssText = "";
  savedScrollY = 0;
}
