import type { LocalizedString } from "./types";

/**
 * Real footage from the property, shot on 2026-08-03.
 *
 * The source clips were 4K HEVC in a .MOV container — which plays on Safari
 * and nowhere else that matters — so they are transcoded to H.264 720×1280 MP4
 * with a poster frame each, and served from Vercel Blob rather than the repo.
 *
 * CAPTIONS DESCRIBE WHAT IS ACTUALLY IN EACH CLIP. Four of the five are the
 * pool, the cabins and the bungalows; only `tubing-4` is the slide itself.
 * Labelling a pool clip as the tubing run would be the same mistake the image
 * registry already had to be rescued from.
 */

const BASE = "https://rxblzbvichchznop.public.blob.vercel-storage.com/video";

export type VideoClip = {
  key: string;
  /** Full 720x1280 clip with sound — fetched only when a card is opened. */
  src: string;
  /**
   * 400px-wide silent encode for the rail.
   *
   * The rail used to autoplay `src`, all 37 MB of it across five files, which is
   * why only one clip at a time was ever allowed to run — and why the other four
   * cards sat there as frozen posters looking broken. A card is ~280px wide, so
   * a 720p master was never the right file for it.
   *
   * The five previews come to 5.4 MB (426 KB to 2.8 MB each — the track clip is
   * the long one), against 37 MB for the masters. See scripts/make-video-previews.js.
   */
  previewSrc: string;
  poster: string;
  /** Portrait, from an iPhone held upright. */
  ratio: "9/16";
  title: LocalizedString;
  caption: LocalizedString;
};

/** The slide itself, first — it is the only clip that shows the product. */
export const tubingVideos: VideoClip[] = [
  {
    key: "tubing-4",
    src: `${BASE}/tubing-4.mp4`,
    previewSrc: `${BASE}/tubing-4-preview.mp4`,
    poster: `${BASE}/tubing-4.jpg`,
    ratio: "9/16",
    title: { ru: "Спуск от первого лица", uz: "Birinchi shaxs ko'zi bilan", en: "The run, first person" },
    caption: {
      ru: "Вся трасса сверху донизу — так это выглядит с ватрушки",
      uz: "Trassa boshidan oxirigacha — tubingdan qanday ko'rinadi",
      en: "The whole track top to bottom, seen from the tube",
    },
  },
  {
    key: "tubing-1",
    src: `${BASE}/tubing-1.mp4`,
    previewSrc: `${BASE}/tubing-1-preview.mp4`,
    poster: `${BASE}/tubing-1.jpg`,
    ratio: "9/16",
    title: { ru: "Бассейн и хребет", uz: "Basseyn va tizma", en: "The pool and the ridge" },
    caption: {
      ru: "Открытый бассейн, шезлонги и горы за домиками",
      uz: "Ochiq basseyn, shezlonglar va uychalar ortidagi tog'lar",
      en: "The outdoor pool, the loungers and the mountains behind the cabins",
    },
  },
  {
    key: "tubing-5",
    src: `${BASE}/tubing-5.mp4`,
    previewSrc: `${BASE}/tubing-5-preview.mp4`,
    poster: `${BASE}/tubing-5.jpg`,
    ratio: "9/16",
    title: { ru: "Бунгало у воды", uz: "Suv bo'yidagi bungalolar", en: "Bungalows by the water" },
    caption: {
      ru: "Те самые бунгало, которые бронируются к бассейну",
      uz: "Basseynga qo'shib bron qilinadigan o'sha bungalolar",
      en: "The bungalows that are booked alongside the pool",
    },
  },
  {
    key: "tubing-3",
    src: `${BASE}/tubing-3.mp4`,
    previewSrc: `${BASE}/tubing-3-preview.mp4`,
    poster: `${BASE}/tubing-3.jpg`,
    ratio: "9/16",
    title: { ru: "Домики на газоне", uz: "Maysazordagi uychalar", en: "Cabins on the lawn" },
    caption: {
      ru: "A-frame глэмпинг и дорожки между домиками",
      uz: "A-frame glemping va uychalar orasidagi yo'lakchalar",
      en: "A-frame glamping and the paths between the cabins",
    },
  },
  {
    key: "tubing-2",
    src: `${BASE}/tubing-2.mp4`,
    previewSrc: `${BASE}/tubing-2-preview.mp4`,
    poster: `${BASE}/tubing-2.jpg`,
    ratio: "9/16",
    title: { ru: "Чимганский хребет", uz: "Chimgon tizmasi", en: "The Chimgan ridge" },
    caption: {
      ru: "Вид, который открывается прямо от домика",
      uz: "To'g'ridan-to'g'ri uychadan ochiladigan manzara",
      en: "The view straight from the cabin",
    },
  },
];
