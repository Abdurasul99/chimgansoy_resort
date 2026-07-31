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
  /**
   * CGI, not photography. The section is headed "Фотогалерея", and the caption
   * only appears on hover — which is no disclosure at all on touch — so these
   * carry a badge that is always visible.
   */
  render?: boolean;
};

const RENDER_LABEL = { ru: "Визуализация", uz: "Vizualizatsiya", en: "Rendering" };

/**
 * Curation follows the site's product: the hero cell and the tall cell are the
 * two rooms a guest books, the rest is the grounds and the day around them.
 * The mosaic used to open on a topchan and give two cells to the day-use kit.
 */
const CELLS: Cell[] = [
  {
    image: "chaletLounge",
    caption: { ru: "Кухня-зал в шале", uz: "Shaledagi oshxona-zal", en: "The chalet kitchen-lounge" },
    span: "md:col-span-2 md:row-span-2",
  },
  {
    image: "aframeRoom",
    caption: { ru: "Глэмпинг A-frame", uz: "A-frame glemping", en: "A-frame glamping" },
    span: "",
  },
  {
    image: "aframeTerraceView",
    caption: { ru: "Вид с террасы", uz: "Terrasadan manzara", en: "The view from the terrace" },
    span: "",
  },
  {
    image: "chaletBedroomDouble",
    caption: { ru: "Спальня шале", uz: "Shale yotoqxonasi", en: "Chalet bedroom" },
    span: "md:row-span-2",
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
    render: true,
  },
  {
    image: "poolLifestyle",
    caption: { ru: "Бассейн днём", uz: "Kunduzgi basseyn", en: "The pool by day" },
    span: "md:col-span-2",
    render: true,
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
            {cell.render && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/90 backdrop-blur-sm">
                {text(RENDER_LABEL, locale)}
              </span>
            )}
            <figcaption className="bento-caption">
              {text(cell.caption, locale)}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
