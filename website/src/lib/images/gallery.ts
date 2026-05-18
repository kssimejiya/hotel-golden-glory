import type { GalleryImage, Room } from "@/types";

/**
 * Stable identity key for a gallery image. The Phase-7 `original` URL takes
 * precedence; pre-Phase-7 entries fall back to `url`. Used for heroImage
 * matching, delete/reorder/setHero actions, and React keys.
 *
 * Client-safe (no Firebase admin SDK import) — can be used from anywhere.
 */
export function imageKey(g: GalleryImage): string {
  return g.original ?? g.url ?? "";
}

/**
 * Find the GalleryImage referenced by `room.heroImage`. If the stored hero
 * URL doesn't match any gallery entry (e.g. drifted after a manual Firestore
 * edit), returns a synthetic legacy entry so SmartImage still renders the
 * raw URL via its legacy path instead of crashing.
 */
export function resolveHeroImage(room: Room): GalleryImage {
  const match = room.gallery.find((g) => imageKey(g) === room.heroImage);
  if (match) return match;
  return { url: room.heroImage };
}
