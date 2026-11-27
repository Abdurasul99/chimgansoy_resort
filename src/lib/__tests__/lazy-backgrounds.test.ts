/**
 * Фоновые фото включаются только рядом с экраном (27.11.2026: главная сразу
 * качала 47 кадров на 4,7 МБ). Скрипт пишет правила в свой <style> по адресу
 * кадра и не трогает разметку React.
 */
import { describe, expect, it } from "vitest";
import { lazyBackgrounds, lazyBackgroundsScript } from "../lazy-backgrounds";

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const settle = async () => {
  await Promise.resolve();
  await frame();
  await frame();
};

function bg(name: string, top: number, size = 200) {
  const el = document.createElement("div");
  el.setAttribute(
    "style",
    `--bg-sm:url("/_next/image?url=%2Fimages%2F${name}.jpg&w=1080&q=75");--bg-lg:url("/_next/image?url=%2Fimages%2F${name}.jpg&w=1920&q=75");background-position:center`,
  );
  let t = top;
  el.getBoundingClientRect = () => ({ top: t, bottom: t + size, left: 0, right: size, width: size, height: size, x: 0, y: t, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  return { el, moveTo: (v: number) => (t = v) };
}

const rules = () => {
  const style = document.querySelector("style[data-lazy-bg]") as HTMLStyleElement;
  return [...(style.sheet as CSSStyleSheet).cssRules].map((r) => r.cssText).join("\n");
};

describe("ленивые фоновые фото", () => {
  it("первый экран сразу, дальние — при прокрутке, скрытые — никогда", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    lazyBackgrounds();
    expect(rules()).toContain("background-image: none");

    bg("hero", 0);
    const far = bg("far", 6000);
    bg("hidden", 100, 0);
    await settle();

    expect(rules()).toContain("hero.jpg&w=1080");
    expect(rules()).toMatch(/min-width: ?640px\)\s*\{[^}]*hero\.jpg[^}]*var\(--bg-lg\)/); // широкий экран — свой размер
    expect(rules()).not.toContain("far.jpg");
    expect(rules()).not.toContain("hidden.jpg");

    far.moveTo(1500); // в пределах полутора экранов
    window.dispatchEvent(new Event("scroll"));
    await settle();
    expect(rules()).toContain("far.jpg");
    expect(rules()).not.toContain("hidden.jpg");
  });

  it("строка для <head> — самодостаточная функция", () => {
    expect(lazyBackgroundsScript.startsWith("(function")).toBe(true);
    expect(() => new Function(lazyBackgroundsScript)).not.toThrow();
  });
});
