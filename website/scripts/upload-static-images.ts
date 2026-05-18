/**
 * One-time migration: upload every static room image referenced by
 * content.ts (under /public/images/rooms/...) to Firebase Storage in the
 * Phase-7 multi-size shape, then rewrite each room's `heroImage` + gallery
 * in Firestore to point at the new variants.
 *
 * Idempotent — if a room is already in the new shape (gallery entries have
 * `variants` AND originals on firebasestorage.app), the script skips it.
 *
 * Run with:
 *   npm run upload:images
 */
import { resolve, join, extname, basename } from "node:path";
import { readFileSync, existsSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, storage, bucketName } from "./lib/init-admin";
import { rooms } from "../src/lib/content";

if (!bucketName) {
  throw new Error(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set in .env.local — see .env.local.example"
  );
}

const bucket = storage().bucket(bucketName);

const PUBLIC_DIR = resolve(process.cwd(), "public");
const FIREBASE_HOST = "firebasestorage.googleapis.com";

const QUALITY = 90;
const BLUR_WIDTH = 20;
const BLUR_QUALITY = 40;
const TARGET_LONGEST_EDGES = [2400, 1600, 1024, 640];

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

interface ImageVariantDoc {
  url: string;
  width: number;
  height: number;
}

interface UploadedImage {
  original: string;
  blurDataURL?: string;
  width: number;
  height: number;
  variants?: { avif: ImageVariantDoc[]; webp: ImageVariantDoc[] };
}

const cache = new Map<string, UploadedImage>();

function buildUrl(objectName: string, token: string): string {
  return `https://${FIREBASE_HOST}/v0/b/${bucket.name}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
}

async function uploadBuffer(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const token = randomUUID();
  await bucket.file(objectName).save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return buildUrl(objectName, token);
}

async function processLocalImage(
  slug: string,
  publicPath: string
): Promise<UploadedImage | null> {
  if (cache.has(publicPath)) return cache.get(publicPath)!;
  if (!publicPath.startsWith("/")) {
    console.warn(`  ! skipping non-public-path: ${publicPath}`);
    return null;
  }
  const absPath = join(PUBLIC_DIR, publicPath);
  if (!existsSync(absPath) || !statSync(absPath).isFile()) {
    console.warn(`  ! missing file: ${absPath}`);
    return null;
  }
  const ext = extname(absPath).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
  const buffer = readFileSync(absPath);

  const meta = await sharp(buffer, { failOn: "none" }).metadata();
  const fullW = meta.width;
  const fullH = meta.height;
  if (typeof fullW !== "number" || typeof fullH !== "number") {
    console.warn(`  ! could not read dimensions: ${absPath}`);
    return null;
  }

  const imageId = randomUUID();

  // 1. Upload original.
  const originalObject = `rooms/${slug}/${imageId}/original${ext}`;
  const originalUrl = await uploadBuffer(originalObject, buffer, contentType);
  console.log(`    ↑ ${basename(absPath)}  →  ${originalObject}`);

  // 2. Variants.
  const longest = Math.max(fullW, fullH);
  const targets = TARGET_LONGEST_EDGES.filter((e) => e <= longest);
  if (targets.length === 0) targets.push(longest);

  const avif: ImageVariantDoc[] = [];
  const webp: ImageVariantDoc[] = [];

  for (const t of targets) {
    const resized = sharp(buffer, { failOn: "none" })
      .resize({ width: t, height: t, fit: "inside", withoutEnlargement: true })
      .withMetadata({});
    let actualW = t;
    let actualH = Math.round((t * fullH) / fullW);
    try {
      const rm = await resized.clone().metadata();
      if (typeof rm.width === "number") actualW = rm.width;
      if (typeof rm.height === "number") actualH = rm.height;
    } catch {
      continue;
    }
    try {
      const avifBuf = await resized.clone().avif({ quality: QUALITY }).toBuffer();
      const url = await uploadBuffer(
        `rooms/${slug}/${imageId}/${actualW}.avif`,
        avifBuf,
        "image/avif"
      );
      avif.push({ url, width: actualW, height: actualH });
    } catch (err) {
      console.warn(`    ! avif ${actualW} failed:`, err);
    }
    try {
      const webpBuf = await resized.clone().webp({ quality: QUALITY }).toBuffer();
      const url = await uploadBuffer(
        `rooms/${slug}/${imageId}/${actualW}.webp`,
        webpBuf,
        "image/webp"
      );
      webp.push({ url, width: actualW, height: actualH });
    } catch (err) {
      console.warn(`    ! webp ${actualW} failed:`, err);
    }
  }

  avif.sort((a, b) => a.width - b.width);
  webp.sort((a, b) => a.width - b.width);

  // 3. Blur.
  let blurDataURL: string | undefined;
  try {
    const blurBuf = await sharp(buffer, { failOn: "none" })
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: BLUR_QUALITY })
      .toBuffer();
    blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;
  } catch {}

  const result: UploadedImage = {
    original: originalUrl,
    width: fullW,
    height: fullH,
    ...(blurDataURL ? { blurDataURL } : {}),
    ...(avif.length > 0 && webp.length > 0 ? { variants: { avif, webp } } : {}),
  };
  cache.set(publicPath, result);
  return result;
}

interface RawGalleryEntry {
  url?: string;
  original?: string;
}

function isAlreadyMigrated(existing: Record<string, unknown>): boolean {
  const heroOk =
    typeof existing.heroImage === "string" &&
    existing.heroImage.includes(FIREBASE_HOST);
  const gallery = existing.gallery;
  if (!Array.isArray(gallery) || gallery.length === 0) return false;
  const galleryOk = gallery.every(
    (g: unknown) =>
      typeof g === "object" &&
      g !== null &&
      typeof (g as { original?: unknown }).original === "string" &&
      ((g as { original: string }).original as string).includes(FIREBASE_HOST) &&
      !!(g as { variants?: { webp?: unknown[] } }).variants?.webp?.length
  );
  return heroOk && galleryOk;
}

async function migrateRoom(
  slug: string,
  heroPath: string,
  gallery: RawGalleryEntry[]
) {
  const docRef = db().collection("rooms").doc(slug);
  const snap = await docRef.get();
  const existing = snap.exists ? (snap.data() ?? {}) : {};

  if (isAlreadyMigrated(existing)) {
    console.log(`  · ${slug}: already migrated (Phase-7 shape) — skipping`);
    return;
  }

  console.log(`  · ${slug}: uploading ${gallery.length} images...`);
  const newGallery: UploadedImage[] = [];
  for (const entry of gallery) {
    const path = entry.url ?? entry.original ?? "";
    if (!path) continue;
    const result = await processLocalImage(slug, path);
    if (result) newGallery.push(result);
  }
  const heroUploaded = await processLocalImage(slug, heroPath);
  const newHero = heroUploaded?.original ?? newGallery[0]?.original ?? "";

  if (!newHero || newGallery.length === 0) {
    console.warn(`  ! ${slug}: no images uploaded — Firestore doc not changed`);
    return;
  }

  await docRef.set(
    {
      heroImage: newHero,
      gallery: newGallery,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`    ✓ ${slug} firestore doc updated`);
}

async function main() {
  console.log(`Phase-7: uploading static images → Firebase Storage (bucket: ${bucketName})\n`);
  for (const room of rooms) {
    await migrateRoom(room.slug, room.heroImage, room.gallery);
  }
  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nMigration failed:");
    console.error(err?.message ?? err);
    if (err?.code === 404 || /bucket.*not.*exist/i.test(String(err))) {
      console.error(
        "\nHint: enable Firebase Storage in the console → Build → Storage → Get started."
      );
    }
    process.exit(1);
  });
