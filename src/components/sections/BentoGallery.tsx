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


/**
 * Curated for impact, not for inventory. The full archive sits directly below
 * this mosaic on the homepage — this is the six frames that have to earn the
 * scroll, not a complete set.
 *
 * Five of the six are the August-2026 shoot: the pool, the chalets under the
 * ridge, the mosaic on the pool floor, the bungalows, the chalet terrace. The
 * sixth is the A-frame interior, which stays because the silhouette IS the
 * product and no exterior frame conveys it.
 *
 * Fewer cells, bigger cells. Seven small tiles competed with each other; six
 * with a dominant hero gives the eye somewhere to land.
 */
const CELLS: Cell[] = [
  {
    image: "poolPanorama",
    caption: { ru: "Бассейн и горы", uz: "Basseyn va tog'lar", en: "The pool and the mountains" },
    span: "md:col-span-2 md:row-span-2",
  },
  {
    image: "chaletPeaks",
    caption: { ru: "Шале под гребнем", uz: "Tizma ostidagi shalelar", en: "Chalets beneath the ridge" },
    span: "md:col-span-2",
  },
  {
    image: "poolLogoTall",
    caption: { ru: "Мозаика на дне", uz: "Tubdagi mozaika", en: "The mosaic on the floor" },
    span: "",
  },
  {
    image: "poolCabanas",
    caption: { ru: "Бунгало у воды", uz: "Suv bo'yidagi bungalolar", en: "Bungalows by the water" },
    span: "",
  },
  {
    image: "aframeRoom",
    caption: { ru: "Глэмпинг A-frame", uz: "A-frame glemping", en: "A-frame glamping" },
    span: "md:col-span-2",
  },
  {
    image: "chaletTerrace",
    caption: { ru: "Терраса шале", uz: "Shale terrasasi", en: "The chalet terrace" },
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
