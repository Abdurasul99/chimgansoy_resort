import type { CSSProperties } from "react";
import type { ImageAsset } from "@/content/types";

function cssUrl(src: string) {
  return `url("${src.replaceAll('"', '\\"')}")`;
}

export function imageLayer(image: ImageAsset) {
  const sources = image.localSrc ? [image.localSrc, image.src] : [image.src];
  return sources.map(cssUrl).join(", ");
}

export function imageStyle(image: ImageAsset): CSSProperties {
  return {
    backgroundImage: imageLayer(image),
    backgroundPosition: image.position ?? "center",
  };
}
