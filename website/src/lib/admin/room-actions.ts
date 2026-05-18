"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminSession } from "./session";
import { roomRepo, imageKey } from "@/lib/firebase/roomRepo";
import { availabilityRepo } from "@/lib/firebase/availabilityRepo";
import { adminBucket, adminDb } from "@/lib/firebase/admin";
import { processGalleryImage } from "@/lib/images/process";
import type { GalleryImage, MealPlan, RoomRate, RoomSlug } from "@/types";
import { randomUUID } from "node:crypto";

async function requireAdmin() {
  const user = await verifyAdminSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

const ROOM_SLUGS: RoomSlug[] = ["deluxe", "superior", "premium", "blues-suite"];

function assertSlug(slug: string): RoomSlug {
  if (!ROOM_SLUGS.includes(slug as RoomSlug)) {
    throw new Error(`Invalid room slug: ${slug}`);
  }
  return slug as RoomSlug;
}

function revalidateRoomPaths(slug: RoomSlug) {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${slug}`);
  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${slug}`);
}

export async function updateTotalRoomsAction(slug: string, totalRooms: number) {
  await requireAdmin();
  const s = assertSlug(slug);
  if (!Number.isInteger(totalRooms) || totalRooms < 0 || totalRooms > 999) {
    return { error: "Total rooms must be a whole number between 0 and 999" };
  }
  await roomRepo.update(s, { totalRooms });
  revalidateRoomPaths(s);
  return { success: true };
}

const MEAL_PLANS: MealPlan[] = ["EP", "CP", "MAP"];
const RATE_MIN = 0;
const RATE_MAX = 99999;

function isValidRateValue(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= RATE_MIN && n <= RATE_MAX;
}

export async function updateRoomRatesAction(slug: string, rates: RoomRate[]) {
  await requireAdmin();
  const s = assertSlug(slug);

  if (!Array.isArray(rates) || rates.length !== MEAL_PLANS.length) {
    return { error: `Rates must include all ${MEAL_PLANS.length} meal plans.` };
  }
  const seen = new Set<MealPlan>();
  for (const r of rates) {
    if (!r || typeof r !== "object") {
      return { error: "Rate row missing or malformed." };
    }
    if (!MEAL_PLANS.includes(r.plan)) {
      return { error: `Unknown meal plan: ${String(r.plan)}` };
    }
    if (seen.has(r.plan)) {
      return { error: `Duplicate meal plan: ${r.plan}` };
    }
    seen.add(r.plan);
    if (!isValidRateValue(r.single) || !isValidRateValue(r.double)) {
      return {
        error: `Rates for ${r.plan} must be whole numbers between ${RATE_MIN} and ${RATE_MAX}.`,
      };
    }
  }

  // Normalize ordering to EP, CP, MAP so downstream consumers see a stable shape.
  const normalized = MEAL_PLANS.map(
    (plan) => rates.find((r) => r.plan === plan)!
  ).map(({ plan, single, double }) => ({ plan, single, double }));

  try {
    await roomRepo.update(s, { rates: normalized });
  } catch (err) {
    console.error("[updateRoomRatesAction] roomRepo.update failed:", err);
    return { error: "Could not save rates. Please try again." };
  }
  revalidateRoomPaths(s);
  return { success: true };
}

// Raised from 8MB to 15MB in Phase 7: we now want hi-res originals to feed the
// 2400px AVIF/WebP variant. sharp handles 15MB inputs in ~200-400ms.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function uploadRoomImageAction(slug: string, formData: FormData) {
  await requireAdmin();
  const s = assertSlug(slug);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "File must be under 15 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  let bucket: ReturnType<typeof adminBucket>;
  try {
    bucket = adminBucket();
  } catch (err) {
    console.error("[uploadRoomImageAction] bucket init failed:", err);
    return { error: "Firebase Storage is not configured. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageId = randomUUID();

  // Try the full Phase-7 pipeline (original + multi-size AVIF/WebP + blur).
  // If sharp can't even parse the buffer, fall back to a legacy {url} entry
  // pointing at a single raw upload so the photo is never lost.
  let galleryEntry: GalleryImage;
  try {
    const { image, succeeded, failed, attempted } = await processGalleryImage(
      buffer,
      s,
      { imageId, contentType: file.type }
    );
    galleryEntry = image;
    if (failed > 0) {
      console.warn(
        `[uploadRoomImageAction] ${s}/${imageId}: ${succeeded}/${attempted} variants succeeded, ${failed} failed`
      );
    }
  } catch (err) {
    console.error(
      `[uploadRoomImageAction] processGalleryImage failed for ${s}/${imageId}, falling back to single raw upload:`,
      err
    );
    // Fall back to legacy single-upload so we don't lose the image entirely.
    const ext = file.name.split(".").pop() || "jpg";
    const fallbackObject = `rooms/${s}/${imageId}/original.${ext}`;
    const token = randomUUID();
    try {
      await bucket.file(fallbackObject).save(buffer, {
        contentType: file.type,
        resumable: false,
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      });
    } catch (uploadErr) {
      console.error("[uploadRoomImageAction] fallback upload failed:", uploadErr);
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      if (msg.includes("does not exist") || msg.includes("bucket")) {
        return { error: "Firebase Storage bucket not found. Enable Storage in the Firebase console (Build → Storage → Get started)." };
      }
      return { error: `Upload failed: ${msg}` };
    }
    galleryEntry = {
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fallbackObject)}?alt=media&token=${token}`,
    };
  }

  // Atomic append — avoids races between concurrent uploads.
  await adminDb()
    .collection("rooms")
    .doc(s)
    .set(
      {
        gallery: FieldValue.arrayUnion(galleryEntry),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

  // Identity key for the new entry — the original URL if we have one, else
  // the fallback url. This is what heroImage will match against.
  const entryKey = imageKey(galleryEntry);

  // Promote to hero if none set yet.
  const room = await roomRepo.getBySlug(s);
  if (room && (!room.heroImage || room.heroImage === "")) {
    await roomRepo.update(s, { heroImage: entryKey });
  }

  revalidateRoomPaths(s);
  return { success: true, url: entryKey };
}

/**
 * Decode an `original` URL like
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/rooms%2F{slug}%2F{imageId}%2Foriginal.jpg?alt=media&token=...
 * into the `rooms/{slug}/{imageId}` folder prefix so we can recursively
 * delete every variant under it. Returns null if the URL doesn't look like
 * one of our Phase-7 paths.
 */
function originalUrlToFolderPrefix(url: string): string | null {
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  const path = decodeURIComponent(match[1]!);
  // Expected: rooms/{slug}/{imageId}/original.{ext}
  const folder = path.replace(/\/[^/]+$/, "");
  // Sanity: must look like rooms/<slug>/<imageId>
  if (!/^rooms\/[^/]+\/[^/]+$/.test(folder)) return null;
  return folder;
}

/** Single-file delete fallback for legacy {url} entries. */
function urlToStoragePath(url: string): string | null {
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]!);
}

export async function deleteRoomImageAction(slug: string, url: string) {
  await requireAdmin();
  const s = assertSlug(slug);
  const room = await roomRepo.getBySlug(s);
  if (!room) return { error: "Room not found" };

  const target = room.gallery.find((g) => imageKey(g) === url);
  if (!target) return { error: "Image not in gallery" };

  const newGallery = room.gallery.filter((g) => imageKey(g) !== url);
  const update: { gallery: GalleryImage[]; heroImage?: string } = {
    gallery: newGallery,
  };
  if (room.heroImage === url && newGallery.length > 0) {
    update.heroImage = imageKey(newGallery[0]!);
  }
  await roomRepo.update(s, update);

  // Best-effort Storage cleanup. Phase-7 entries live under
  // rooms/{slug}/{imageId}/ — deleteFiles({prefix}) wipes the original AND
  // every {width}.avif / {width}.webp in one call. Legacy single-file entries
  // get the targeted delete.
  try {
    const bucket = adminBucket();
    const folder = target.original ? originalUrlToFolderPrefix(target.original) : null;
    if (folder) {
      await bucket.deleteFiles({ prefix: `${folder}/`, force: true });
    } else if (target.url && target.url.includes("firebasestorage.googleapis.com")) {
      const path = urlToStoragePath(target.url);
      if (path) await bucket.file(path).delete({ ignoreNotFound: true });
    }
  } catch (err) {
    // Never fail the user-visible action on a storage cleanup error; the
    // Firestore reference is already gone, so the image is invisible to
    // users — an orphaned blob in Storage is a minor cost.
    console.error("[deleteRoomImageAction] storage cleanup failed:", err);
  }

  revalidateRoomPaths(s);
  return { success: true };
}

export async function setHeroImageAction(slug: string, url: string) {
  await requireAdmin();
  const s = assertSlug(slug);
  const room = await roomRepo.getBySlug(s);
  if (!room || !room.gallery.some((g) => imageKey(g) === url)) {
    return { error: "Image not in gallery" };
  }
  await roomRepo.update(s, { heroImage: url });
  revalidateRoomPaths(s);
  return { success: true };
}

export async function reorderGalleryAction(slug: string, orderedUrls: string[]) {
  await requireAdmin();
  const s = assertSlug(slug);
  const room = await roomRepo.getBySlug(s);
  if (!room) return { error: "Room not found" };
  if (orderedUrls.length !== room.gallery.length) {
    return { error: "Gallery contents mismatch" };
  }
  const byKey = new Map<string, GalleryImage>();
  const counts = new Map<string, number>();
  for (const g of room.gallery) {
    const k = imageKey(g);
    byKey.set(k, g);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const u of orderedUrls) {
    const c = counts.get(u) ?? 0;
    if (c === 0) return { error: "Gallery contents mismatch" };
    counts.set(u, c - 1);
  }
  // Rebuild gallery in the requested order, carrying variants/blur through.
  const newGallery: GalleryImage[] = orderedUrls.map((u) => byKey.get(u)!);
  await roomRepo.update(s, { gallery: newGallery });
  revalidateRoomPaths(s);
  return { success: true };
}

export async function setAvailabilityBlockAction(
  slug: string,
  fromDate: string,
  toDate: string,
  blocked: number,
  reason?: string
) {
  await requireAdmin();
  const s = assertSlug(slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return { error: "Invalid date format (YYYY-MM-DD)" };
  }
  if (new Date(toDate) < new Date(fromDate)) {
    return { error: "End date must be on or after start date" };
  }
  if (!Number.isInteger(blocked) || blocked < 0) {
    return { error: "Blocked count must be a non-negative integer" };
  }
  const room = await roomRepo.getBySlug(s);
  if (!room) return { error: "Room not found" };
  if (blocked > room.totalRooms) {
    return {
      error: `Cannot block ${blocked} rooms — this category only has ${room.totalRooms} total`,
    };
  }
  await availabilityRepo.setBlockRange(s, fromDate, toDate, blocked, reason);
  revalidatePath(`/admin/rooms/${s}`);
  return { success: true };
}
