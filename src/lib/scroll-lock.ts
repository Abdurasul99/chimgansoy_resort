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
  }
}

// Test/debug only — never call from production code.
export function _resetLock(): void {
  lockCount = 0;
  savedCssText = "";
  savedScrollY = 0;
}
