import type { Locale } from "@/i18n/config";
import { resortImages } from "@/content/images";
import { text } from "@/lib/localize";

/**
 * BentoGallery — asymmetric editorial mosaic of the best real photos.
 * Cells span different grid areas (bento-box style); each photo zooms on
 * hover and its caption slides up. Pure CSS, no JS.
 */

type Cell = {
  image: keyof typeof resortImages;
  caption: { ru: string; uz: string; en: string };
  /** tailwind col/row span classes for the desktop grid */
  span: string;
};

const CELLS: Cell[] = [
  {
    image: "galTopchanPeaks",
    caption: { ru: "Топчаны у подножия", uz: "Tog' etagidagi topchanlar", en: "Topchans at the foothills" },
    span: "md:col-span-2 md:row-span-2",
  },
  {
    image: "galFoodServing",
    caption: { ru: "Кухня на углях", uz: "Cho'g'dagi taomlar", en: "Charcoal kitchen" },
    span: "",
  },
  {
    image: "galTopchanSwing",
    caption: { ru: "Кровать-качели", uz: "Arg'imchoq karavot", en: "Swing bed" },
    span: "",
  },
  {
    image: "galMangalFire",
    caption: { ru: "Мангал и казан", uz: "Mangal va qozon", en: "Mangal & kazan" },
    span: "md:row-span-2",
  },
  {
    image: "galPathway",
    caption: { ru: "Прогулки по территории", uz: "Hudud bo'ylab sayr", en: "Garden walks" },
    span: "md:col-span-2",
  },
  {
    image: "galKidsSwing",
    caption: { ru: "Детская зона", uz: "Bolalar maydonchasi", en: "Kids corner" },
    span: "",
  },
  {
    image: "galMountainView",
    caption: { ru: "1700 метров над уровнем моря", uz: "Dengiz sathidan 1700 metr", en: "1700 m above sea level" },
    span: "md:col-span-2",
  },
];

export function BentoGallery({ locale }: { locale: Locale }) {
  return (
    <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4 md:gap-4">
      {CELLS.map((cell) => {
        const img = resortImages[cell.image];
        return (
          <figure key={cell.image} className={`bento-cell group min-w-0 ${cell.span}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.localSrc ?? img.src}
              alt={text(img.alt, locale)}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
            />
            <figcaption className="bento-caption">
              {text(cell.caption, locale)}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
