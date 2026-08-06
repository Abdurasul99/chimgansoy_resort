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

export type LiveRoom = {
  base: Room;
  /** Ready to render: either the operator's lines or the code's, per locale. */
  amenities: (locale: Locale) => string[];
  features: (locale: Locale) => string[];
  /**
   * Image keys, already validated against the registry — so the room page can
   * index resortImages with them without a second check.
   */
  gallery: (keyof typeof resortImages)[];
  priceNote?: string;
  /** true when the operator has replaced this list, for the admin to show. */
  edited: { amenities: boolean; features: boolean; gallery: boolean };
};

/** Drops keys that no longer exist in the registry — a renamed photo must not 500. */
type ImageKey = keyof typeof resortImages;

function validGallery(
  keys: string[] | undefined,
  fallback: ImageKey[],
): { list: ImageKey[]; edited: boolean } {
  if (!keys) return { list: fallback, edited: false };
  const kept = keys.filter((k): k is ImageKey => k in resortImages);
  // An operator who removed every photo gets the code's gallery back rather
  // than a page with an empty frame where the pictures were.
  return kept.length ? { list: kept, edited: true } : { list: fallback, edited: false };
}

export function resolveRoom(room: Room, data: OverrideData): LiveRoom {
  const patch = data.rooms[room.slug] ?? {};
  const gallery = validGallery(patch.gallery, room.gallery);

  return {
    base: room,
    amenities: (locale) => patch.amenities ?? room.amenities[locale],
    features: (locale) => patch.features ?? room.features[locale],
    gallery: gallery.list,
    priceNote: patch.priceNote,
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
