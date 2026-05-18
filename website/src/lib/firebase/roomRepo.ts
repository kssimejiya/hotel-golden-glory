import "server-only";
import { cache } from "react";
import { adminDb } from "./admin";
import { rooms as staticRooms } from "@/lib/content";
import type {
  GalleryImage,
  ImageVariant,
  Room,
  RoomRate,
  RoomSlug,
} from "@/types";

// imageKey + resolveHeroImage live in @/lib/images/gallery so client
// components can import them without pulling in the server-only Firebase
// admin SDK. Re-exported here for server-side ergonomics.
export { imageKey, resolveHeroImage } from "@/lib/images/gallery";

/**
 * Firestore overrides for static room data in content.ts.
 * Any field set on rooms/{slug} overrides the static default; missing fields
 * fall back to the static value. On Firebase errors we degrade gracefully to
 * the static defaults so the public site keeps rendering.
 *
 * gallery accepts the new GalleryImage[] shape OR legacy string[] (pre-Phase-5
 * docs). normalizeGallery() upgrades legacy entries to the object shape with
 * blurDataURL left undefined — SmartImage falls back to a shimmer skeleton
 * for those until the backfill migration runs.
 */
export interface RoomOverride {
  totalRooms?: number;
  heroImage?: string;
  gallery?: Array<string | GalleryImage>;
  rates?: RoomRate[];
  updatedAt?: string;
}

const COLLECTION = "rooms";
const VALID_PLANS = new Set(["EP", "CP", "MAP"]);

function isValidRates(rates: unknown): rates is RoomRate[] {
  if (!Array.isArray(rates) || rates.length === 0) return false;
  for (const r of rates) {
    if (!r || typeof r !== "object") return false;
    const rate = r as Partial<RoomRate>;
    if (!rate.plan || !VALID_PLANS.has(rate.plan)) return false;
    if (typeof rate.single !== "number" || typeof rate.double !== "number") {
      return false;
    }
  }
  return true;
}

function isImageVariantArray(v: unknown): v is ImageVariant[] {
  if (!Array.isArray(v)) return false;
  for (const item of v) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as ImageVariant).url !== "string" ||
      typeof (item as ImageVariant).width !== "number" ||
      typeof (item as ImageVariant).height !== "number"
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Accepts any of the three on-disk shapes (see GalleryImage docstring):
 *   - bare URL string                              (pre-Phase-5)
 *   - { url, blurDataURL?, width?, height? }       (Phase-5)
 *   - { original, blurDataURL?, width, height, variants } (Phase-7)
 *
 * Returns a GalleryImage with at least ONE identity URL set (`original` or
 * `url`). Anything else returns null and gets dropped on read. Renderers
 * decide which path to use by checking `variants?.webp`.
 */
function normalizeGalleryEntry(
  entry: string | GalleryImage | null | undefined
): GalleryImage | null {
  if (entry == null) return null;
  if (typeof entry === "string") {
    return entry.length > 0 ? { url: entry } : null;
  }
  if (typeof entry !== "object") return null;

  // Have to have AT LEAST one URL to be renderable.
  const hasOriginal = typeof entry.original === "string" && entry.original.length > 0;
  const hasUrl = typeof entry.url === "string" && entry.url.length > 0;
  if (!hasOriginal && !hasUrl) return null;

  // Variants are optional — only honor them if both arrays look well-formed.
  // A half-built variants object (one array invalid) drops back to the
  // legacy path rather than rendering a broken <picture>.
  let variants: GalleryImage["variants"] | undefined;
  if (entry.variants && typeof entry.variants === "object") {
    const avif = entry.variants.avif;
    const webp = entry.variants.webp;
    if (isImageVariantArray(avif) && isImageVariantArray(webp)) {
      variants = { avif, webp };
    }
  }

  return {
    ...(hasOriginal ? { original: entry.original } : {}),
    ...(hasUrl ? { url: entry.url } : {}),
    ...(typeof entry.blurDataURL === "string"
      ? { blurDataURL: entry.blurDataURL }
      : {}),
    ...(typeof entry.width === "number" ? { width: entry.width } : {}),
    ...(typeof entry.height === "number" ? { height: entry.height } : {}),
    ...(typeof entry.alt === "string" ? { alt: entry.alt } : {}),
    ...(variants ? { variants } : {}),
  };
}

function normalizeGallery(
  gallery: Array<string | GalleryImage> | undefined
): GalleryImage[] | null {
  if (!Array.isArray(gallery) || gallery.length === 0) return null;
  const out: GalleryImage[] = [];
  for (const entry of gallery) {
    const norm = normalizeGalleryEntry(entry);
    if (norm) out.push(norm);
  }
  return out.length > 0 ? out : null;
}

function mergeOverride(base: Room, override: RoomOverride | null): Room {
  if (!override) return base;
  const normalizedGallery = normalizeGallery(override.gallery);
  return {
    ...base,
    totalRooms: override.totalRooms ?? base.totalRooms,
    heroImage: override.heroImage ?? base.heroImage,
    gallery: normalizedGallery ?? base.gallery,
    rates: isValidRates(override.rates) ? override.rates : base.rates,
  };
}

async function fetchOverride(slug: RoomSlug): Promise<RoomOverride | null> {
  try {
    const snap = await adminDb().collection(COLLECTION).doc(slug).get();
    if (!snap.exists) return null;
    return snap.data() as RoomOverride;
  } catch (err) {
    console.error(`[roomRepo] Failed to fetch override for ${slug}:`, err);
    return null;
  }
}

async function fetchAllOverrides(): Promise<Map<RoomSlug, RoomOverride>> {
  const map = new Map<RoomSlug, RoomOverride>();
  try {
    const snap = await adminDb().collection(COLLECTION).get();
    snap.forEach((doc) => {
      map.set(doc.id as RoomSlug, doc.data() as RoomOverride);
    });
  } catch (err) {
    console.error("[roomRepo] Failed to fetch overrides:", err);
  }
  return map;
}

// Per-request memoization. React's `cache()` dedupes calls to the same
// function within a single render pass (and across multiple Server Components
// in the same request) — so e.g. /rooms/[slug]'s generateMetadata calling
// getBySlug(slug) and the page body calling list() each pay AT MOST ONE
// Firestore round-trip per request, even if other server components in the
// same request also need rooms.
const cachedList = cache(async (): Promise<Room[]> => {
  const overrides = await fetchAllOverrides();
  return staticRooms.map((r) => mergeOverride(r, overrides.get(r.slug) ?? null));
});

const cachedGetBySlug = cache(
  async (slug: RoomSlug): Promise<Room | null> => {
    const base = staticRooms.find((r) => r.slug === slug);
    if (!base) return null;
    const override = await fetchOverride(slug);
    return mergeOverride(base, override);
  }
);

export const roomRepo = {
  list(): Promise<Room[]> {
    return cachedList();
  },

  getBySlug(slug: RoomSlug): Promise<Room | null> {
    return cachedGetBySlug(slug);
  },

  async update(slug: RoomSlug, patch: Partial<RoomOverride>): Promise<void> {
    await adminDb()
      .collection(COLLECTION)
      .doc(slug)
      .set(
        {
          ...patch,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  },

  async getTotalRooms(slug: RoomSlug): Promise<number> {
    const room = await this.getBySlug(slug);
    return room?.totalRooms ?? 0;
  },
};
