import { galleryImages } from "@/content/images";
import type { Locale } from "@/i18n/config";
import { ImageFrame } from "@/components/ui/ImageFrame";

type GalleryProps = {
  locale: Locale;
};

export function Gallery({ locale }: GalleryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {galleryImages.map((image, index) => (
        <ImageFrame
          key={`${image.src}-${index}`}
          image={image}
          locale={locale}
          className={index === 0 || index === 5 ? "aspect-[4/5] lg:row-span-2 lg:aspect-auto" : "aspect-[4/3]"}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      ))}
    </div>
  );
}
