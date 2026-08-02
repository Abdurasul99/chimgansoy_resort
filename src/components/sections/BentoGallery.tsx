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
 * Curated for impact, not for inventory.
 *
 * The mosaic used to spend three of its seven cells on interior close-ups — a
 * bedroom, a kitchen-lounge — which are the room pages' job. At gallery size
 * they read as detail shots of a rental listing rather than a reason to come.
 * What is left is the wide, bright frames: water, lawn, ridge, and one interior
 * that earns its place because the A-frame silhouette IS the product.
 *
 * Fewer cells, bigger cells. Seven small tiles competed with each other; five
 * with a dominant hero gives the eye somewhere to land.
 */
const CELLS: Cell[] = [
  {
    image: "poolLifestyle",
    caption: { ru: "Бассейн днём", uz: "Kunduzgi basseyn", en: "The pool by day" },
    span: "md:col-span-2 md:row-span-2",
  },
  {
    image: "aframeLawnWide",
    caption: { ru: "Домики на газоне", uz: "Maysazordagi uychalar", en: "Cabins on the lawn" },
    span: "md:col-span-2",
  },
  {
    image: "poolAerial",
    caption: { ru: "Бассейн с высоты", uz: "Basseyn yuqoridan", en: "The pool from above" },
    span: "",
  },
  {
    image: "aframeTerraceView",
    caption: { ru: "Вид с террасы", uz: "Terrasadan manzara", en: "The view from the terrace" },
    span: "",
  },
  {
    image: "aframeRoom",
    caption: { ru: "Глэмпинг A-frame", uz: "A-frame glemping", en: "A-frame glamping" },
    span: "md:col-span-2",
  },
  {
    image: "mountainRidge",
    caption: { ru: "Хребет Чимгана", uz: "Chimgon tizmasi", en: "The Chimgan ridge" },
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
