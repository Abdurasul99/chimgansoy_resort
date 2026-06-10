// Global test setup — runs before every test file.
// Sets up jest-dom matchers + MSW server + global mocks for browser-only APIs.
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// ─── MSW: HTTP mocking server ─────────────────────────
// Default handlers stub every external request. Individual tests can override
// per-test via server.use(...) for specific scenarios.
import { setupServer } from "msw/node";
import { defaultHandlers } from "./mocks/handlers";

export const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  cleanup(); // unmount React components after each test
});
afterAll(() => server.close());

// ─── Browser API mocks ────────────────────────────────
// happy-dom doesn't implement these; many components use them.

// IntersectionObserver — used by ScrollObserver and reveal animations
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds = [];
}
globalThis.IntersectionObserver = MockIntersectionObserver as never;

// MutationObserver — used by SnowParticles to watch data-season
// happy-dom does provide this, but tests sometimes need to spy on it
if (!globalThis.MutationObserver) {
  class MockMutationObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  globalThis.MutationObserver = MockMutationObserver as never;
}

// matchMedia — used for prefers-reduced-motion checks
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

  // localStorage clean state
  window.localStorage.clear();

  // Reset document data-season
  document.documentElement.removeAttribute("data-season");
});

// ─── Next.js navigation mocks ─────────────────────────
// `next/navigation` hooks are React-context-bound; tests need direct mocks.
vi.mock("next/navigation", () => ({
  usePathname: () => "/ru",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// `next/link` — pass through to a plain anchor in tests
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children),
  };
});

// `next/script` — render as no-op in tests
vi.mock("next/script", () => ({
  default: () => null,
}));

// `next/font/google` — return stable variable + className for tests
vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "--font-sans", className: "font-sans" }),
  Playfair_Display: () => ({ variable: "--font-serif", className: "font-serif" }),
  Cormorant_Garamond: () => ({ variable: "--font-serif", className: "font-serif" }),
}));
