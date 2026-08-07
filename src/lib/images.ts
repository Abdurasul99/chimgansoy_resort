import type { CSSProperties } from "react";
import type { ImageAsset } from "@/content/types";

function cssUrl(src: string) {
  return `url("${src.replaceAll('"', '\\"')}")`;
}

export function imageLayer(image: ImageAsset) {
  const sources = image.localSrc ? [image.localSrc, image.src] : [image.src];
  return sources.map(cssUrl).join(", ");
}

/**
 * Same background style, for a frame that carries a plain-string alt.
 *
 * Operator uploads have one caption, not three — imageStyle never reads alt
 * anyway, so this is the same function with an honest parameter type instead
 * of a fake LocalizedString wrapped around a single string.
 */
export function frameStyle(frame: { src: string; localSrc?: string; position?: string }): CSSProperties {
  return {
    backgroundImage: frame.localSrc ? [frame.localSrc, frame.src].map(cssUrl).join(", ") : cssUrl(frame.src),
    backgroundPosition: frame.position ?? "center",
  };
}

export function imageStyle(image: ImageAsset): CSSProperties {
  return {
    backgroundImage: imageLayer(image),
    backgroundPosition: image.position ?? "center",
  };
}
