import { describe, expect, it } from "vitest";
import { backgroundOf, frameStyle, imageStyle, responsiveImg } from "@/lib/images";
import { HERO_SLIDES } from "@/content/hero-slides";

/**
 * Фоны и <img> идут через оптимизатор Next (AVIF нужной ширины), а не
 * исходным JPEG — главная на телефоне скачивала 7–8.7 МБ (18.11.2026).
 */
const vars = (s: object) => s as Record<string, string>;

describe("lib/images — оптимизированные картинки", () => {
  it("фон из public — две ширины через /_next/image, q=75", () => {
    const s = vars(imageStyle({ src: "/images/resort/a b.jpg", alt: { ru: "", uz: "", en: "" } }));
    expect(s["--bg-sm"]).toBe(`url("/_next/image?url=${encodeURIComponent("/images/resort/a b.jpg")}&w=1080&q=75")`);
    expect(s["--bg-lg"]).toContain("&w=1920&q=75");
    expect(s.backgroundImage).toBeUndefined(); // ширину выбирает CSS-правило
  });

  it("загрузки из панели и внешние адреса — как есть", () => {
    expect(vars(frameStyle({ src: "/blob/rooms/x.jpg" }))["--bg-sm"]).toBe('url("/blob/rooms/x.jpg")');
    expect(vars(backgroundOf("https://example.com/x.jpg"))["--bg-lg"]).toBe('url("https://example.com/x.jpg")');
    expect(responsiveImg("/blob/x.jpg", "100vw")).toEqual({ src: "/blob/x.jpg" });
  });

  it("одинаковые localSrc и src — один слой, без двойной загрузки", () => {
    const s = vars(imageStyle({ src: "/images/x.jpg", localSrc: "/images/x.jpg", alt: { ru: "", uz: "", en: "" } }));
    expect(s["--bg-sm"].match(/url\(/g)).toHaveLength(1);
  });

  it("<img> получает srcset 640/1080/1920", () => {
    const p = responsiveImg("/images/x.jpg", "50vw");
    expect(p.srcSet?.split(", ").map((x) => x.split(" ")[1])).toEqual(["640w", "1080w", "1920w"]);
    expect(p.sizes).toBe("50vw");
  });

  it("первый кадр слайдшоу — файл из public (его предзагружает главная)", () => {
    expect(HERO_SLIDES[0].startsWith("/images/")).toBe(true);
  });
});
