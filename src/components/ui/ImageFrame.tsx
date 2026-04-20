import Image from "next/image";
import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
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
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: ImageFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-[8px] bg-[var(--mist)] ${className}`}>
      <Image
        src={image.src}
        alt={text(image.alt, locale)}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition duration-700 hover:scale-[1.03]"
      />
    </div>
  );
}
