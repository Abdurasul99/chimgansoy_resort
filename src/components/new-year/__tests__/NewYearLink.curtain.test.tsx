/**
 * Переход с кнопки не зависит от конца анимации занавеса (27.11.2026).
 *
 * На занятом телефоне анимация может стартовать поздно. Раньше страховка
 * подъёма занавеса считалась от нажатия, поднимала его до перехода — и
 * переход отменялся: гость оставался под тёмным экраном. Здесь анимация не
 * заканчивается вовсе, а переход всё равно должен уйти за ~1,1 с.
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { forwardRef, type ReactNode } from "react";

const nav = vi.hoisted(() => ({ pathname: "/ru/nomera", push: vi.fn(), prefetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, prefetch: nav.prefetch, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// framer-motion без анимаций: onAnimationComplete не наступает никогда.
vi.mock("framer-motion", () => {
  const MOTION_PROPS = new Set(["initial", "animate", "transition", "onAnimationComplete", "whileTap", "whileInView", "viewport", "exit", "layout"]);
  const make = (tag: string) =>
    forwardRef<HTMLElement, Record<string, unknown> & { children?: ReactNode }>(function M(props, ref) {
      const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k)));
      const Tag = tag as "div";
      return <Tag ref={ref as never} {...rest} />;
    });
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    useReducedMotion: () => false,
  };
});

import { NewYearLink } from "../NewYearLink";

describe("занавес и переход", () => {
  it("анимация не закончилась — переход всё равно уходит за ~1,1 с", async () => {
    vi.useFakeTimers();
    try {
      render(<NewYearLink locale="ru" variant="pill" />);
      fireEvent.click(screen.getByRole("link", { name: /Зима в горах Чимгана/ }));
      expect(nav.push).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });
      expect(nav.push).toHaveBeenCalledWith("/ru/novyi-god");
      expect(nav.push).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
