import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

type ImageFrameProps = {
  image: ImageAsset;
  locale: Locale;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function ImageFrame({
  image,
  locale,
  className = "aspect-[4/3]",
}: ImageFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[8px] bg-[var(--mist)] bg-cover transition duration-700 hover:scale-[1.01] ${className}`}
      style={imageStyle(image)}
      role="img"
      aria-label={text(image.alt, locale)}
    />
  );
}
