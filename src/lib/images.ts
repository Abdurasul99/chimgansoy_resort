import type { CSSProperties } from "react";
import type { ImageAsset } from "@/content/types";

function cssUrl(src: string) {
  return `url("${src.replaceAll('"', '\\"')}")`;
}

/**
 * Фоновые фото — через оптимизатор Next, а не исходным JPEG.
 *
 * До 18.11.2026 фон задавался исходным файлом: главная на телефоне сразу
 * скачивала 29 фото на 7 МБ (первый экран — 874 КБ), одинаковых для телефона
 * и большого экрана. Через /_next/image тот же кадр — AVIF/WebP нужной
 * ширины: 1080 px ≈ 180 КБ, 1920 px ≈ 460 КБ. Каждый размер кодируется на
 * сервере один раз и лежит в .next/cache/images (переживает выкладку:
 * chimgan-patch собирает на копии рабочей папки).
 *
 * Ширину выбирает CSS — правило [style*="--bg-sm"] в globals.css: до 640 px
 * берётся --bg-sm, шире — --bg-lg. Через оптимизатор идут только файлы из
 * public (/images/…): загрузки из панели (/blob/…) отдаёт nginx, Next их не
 * видит; внешние адреса не трогаем. q=75 — единственное качество, которое
 * Next 16 разрешает без настройки images.qualities.
 */
const WIDTH_SM = 1080;
const WIDTH_LG = 1920;

function optimized(src: string, width: number) {
  return src.startsWith("/images/") ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75` : src;
}

function layers(sources: string[], width: number) {
  return [...new Set(sources.filter(Boolean))].map((s) => cssUrl(optimized(s, width))).join(", ");
}

function backgroundVars(sources: string[], position?: string): CSSProperties {
  return {
    ["--bg-sm" as string]: layers(sources, WIDTH_SM),
    ["--bg-lg" as string]: layers(sources, WIDTH_LG),
    backgroundPosition: position ?? "center",
  } as CSSProperties;
}

/** Исходные адреса слоёв — для мест, где нужен сам файл, а не фон. */
export function imageLayer(image: ImageAsset) {
  const sources = image.localSrc ? [image.localSrc, image.src] : [image.src];
  return [...new Set(sources)].map(cssUrl).join(", ");
}

/**
 * Same background style, for a frame that carries a plain-string alt.
 *
 * Operator uploads have one caption, not three — imageStyle never reads alt
 * anyway, so this is the same function with an honest parameter type instead
 * of a fake LocalizedString wrapped around a single string.
 */
export function frameStyle(frame: { src: string; localSrc?: string; position?: string }): CSSProperties {
  return backgroundVars(frame.localSrc ? [frame.localSrc, frame.src] : [frame.src], frame.position);
}

export function imageStyle(image: ImageAsset): CSSProperties {
  return backgroundVars(image.localSrc ? [image.localSrc, image.src] : [image.src], image.position);
}
