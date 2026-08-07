import { cache } from "react";
import { rooms, type Room } from "@/content/rooms";
import { resortImages } from "@/content/images";
import { readOverrides, type OverrideData } from "@/lib/site-overrides";
import type { Locale } from "@/i18n/config";

/**
 * What /nomera/<slug> shows, with the operator's edits applied.
 *
 * The room page is the longest page a guest reads before paying, and until now
 * every line of it was a deploy: the amenity list, the feature list and the
 * gallery all lived in content/rooms.ts. The operator asked to be able to add
 * and remove those lines themselves, photographs included.
 *
 * WHY A LIST IS REPLACED, NOT MERGED
 * ----------------------------------
 * An operator who deletes "Телевизор" means it. Merging their list with the
 * code's would put it straight back, and there would be no way to remove
 * anything — only to add. So the moment they save a list, that list IS the
 * list; until then the code's is used untouched.
 *
 * WHY EDITS ARE NOT LOCALISED
 * ---------------------------
 * The code's lists are, and stay, translated three ways. An operator line is
 * one string shown on all three locales. Asking for three translations of
 * "Мангал по запросу" gets Russian typed into all three fields — this is the
 * honest version of what would happen anyway.
 */

/**
 * A gallery frame, whichever half of the site it came from.
 *
 * The room page renders both kinds identically — imageStyle() only ever needed
 * a src, a position and an alt — so the page does not have to know or care
 * which photographs are the studio set and which the operator uploaded.
 */
export type GalleryImage = { src: string; localSrc?: string; position?: string; alt: string };

export type LiveRoom = {
  base: Room;
  /** Ready to render: either the operator's lines or the code's, per locale. */
  amenities: (locale: Locale) => string[];
  features: (locale: Locale) => string[];
  /**
   * Image keys, already validated against the registry — so the room page can
   * index resortImages with them without a second check.
   */
  gallery: GalleryImage[];
  /** The stored keys, in order — what the admin picker needs back. */
  galleryKeys: string[];
  priceNote?: string;
  /** «от … сум за ночь», заданная оператором вместо цены из Exely. */
  priceFrom?: number;
  /** true when the operator has replaced this list, for the admin to show. */
  edited: { amenities: boolean; features: boolean; gallery: boolean };
};

type ImageKey = keyof typeof resortImages;

/**
 * One stored key → a renderable frame, from either half of the library.
 *
 * A key is looked up in the code registry first and in the operator's uploads
 * second. Anything that resolves to neither is DROPPED rather than rendered as
 * a broken frame: a photograph deleted in the admin, or one renamed by a
 * deploy, must not turn a room page into a grid of missing images.
 */
function toFrame(key: string, data: OverrideData): GalleryImage | null {
  if (key in resortImages) {
    const img = resortImages[key as ImageKey] as {
      src: string;
      localSrc?: string;
      position?: string;
      alt: { ru: string };
    };
    return { src: img.src, localSrc: img.localSrc, position: img.position, alt: img.alt.ru };
  }
  const up = data.photos.find((p) => p.id === key);
  return up ? { src: up.url, alt: up.alt } : null;
}

function buildGallery(
  keys: string[] | undefined,
  fallback: ImageKey[],
  data: OverrideData,
): { list: GalleryImage[]; keys: string[]; edited: boolean } {
  const usable = (ks: string[]) => ks.filter((k) => toFrame(k, data) !== null);
  const asFrames = (ks: string[]) =>
    ks.map((k) => toFrame(k, data)).filter((f): f is GalleryImage => f !== null);

  if (!keys) return { list: asFrames(fallback), keys: fallback, edited: false };

  const kept = asFrames(keys);
  // An operator who removed every photo gets the code's gallery back rather
  // than a page with an empty frame where the pictures were.
  return kept.length
    ? { list: kept, keys: usable(keys), edited: true }
    : { list: asFrames(fallback), keys: fallback, edited: false };
}

export function resolveRoom(room: Room, data: OverrideData): LiveRoom {
  const patch = data.rooms[room.slug] ?? {};
  const gallery = buildGallery(patch.gallery, room.gallery, data);

  return {
    base: room,
    amenities: (locale) => patch.amenities ?? room.amenities[locale],
    features: (locale) => patch.features ?? room.features[locale],
    gallery: gallery.list,
    galleryKeys: gallery.keys,
    priceNote: patch.priceNote,
    priceFrom: patch.priceFrom,
    edited: {
      amenities: Boolean(patch.amenities),
      features: Boolean(patch.features),
      gallery: gallery.edited,
    },
  };
}

export function resolveRooms(data: OverrideData): LiveRoom[] {
  return rooms.map((r) => resolveRoom(r, data));
}

/** Request-scoped: the room page and its gallery share one read. */
export const getRoom = cache(async (slug: string): Promise<LiveRoom | null> => {
  const room = rooms.find((r) => r.slug === slug);
  if (!room) return null;
  return resolveRoom(room, await readOverrides());
});
