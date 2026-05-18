/**
 * Phase-7 migration: upgrade every Firestore room gallery entry to the new
 * multi-size AVIF+WebP shape.
 *
 * Run with:
 *   npm run migrate:variants
 *
 * Per room doc:
 *   1. Read gallery + heroImage.
 *   2. For each entry:
 *      - If entry already has `variants.webp.length > 0`, skip (idempotent).
 *      - Otherwise: download the existing bytes from `url` (legacy/Phase-5)
 *        or `original` (partially-migrated), then re-run the sharp pipeline
 *        to upload AVIF+WebP variants AND a fresh archived original under
 *        the canonical Phase-7 path. The legacy URL is left in Storage
 *        untouched until the new variants are confirmed uploaded — only
 *        after a successful Firestore write do we attempt cleanup.
 *   3. Rewrite Firestore gallery to the new shape.
 *   4. Rewrite `heroImage` to the new `original` URL of the entry that used
 *      to match the old hero URL.
 *
 * Idempotent — running it again skips entries that already have variants.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, storage, bucketName } from "./lib/init-admin";

if (!bucketName) {
  throw new Error(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set in .env.local — see .env.local.example"
  );
}

const bucket = storage().bucket(bucketName);
const FIREBASE_HOST = "firebasestorage.googleapis.com";

const QUALITY = 90;
const BLUR_WIDTH = 20;
const BLUR_QUALITY = 40;
const TARGET_LONGEST_EDGES = [2400, 1600, 1024, 640];

interface ImageVariantDoc {
  url: string;
  width: number;
  height: number;
}

interface GalleryImageDoc {
  original?: string;
  url?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  alt?: string;
  variants?: { avif: ImageVariantDoc[]; webp: ImageVariantDoc[] };
}

type RawGalleryEntry = string | GalleryImageDoc | null | undefined;

function normalizeEntry(entry: RawGalleryEntry): GalleryImageDoc | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry.length > 0 ? { url: entry } : null;
  if (typeof entry !== "object") return null;
  const hasOrig = typeof entry.original === "string" && entry.original.length > 0;
  const hasUrl = typeof entry.url === "string" && entry.url.length > 0;
  if (!hasOrig && !hasUrl) return null;
  return entry;
}

function entryHasVariants(e: GalleryImageDoc): boolean {
  return !!(
    e.variants &&
    Array.isArray(e.variants.webp) &&
    e.variants.webp.length > 0 &&
    Array.isArray(e.variants.avif) &&
    e.variants.avif.length > 0
  );
}

function entryKey(e: GalleryImageDoc): string {
  return e.original ?? e.url ?? "";
}

async function downloadBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function inferExt(mimeType: string | undefined, fallback = "jpg"): string {
  if (!mimeType) return fallback;
  if (mimeType.startsWith("image/jpeg")) return "jpg";
  if (mimeType.startsWith("image/png")) return "png";
  if (mimeType.startsWith("image/webp")) return "webp";
  if (mimeType.startsWith("image/avif")) return "avif";
  if (mimeType.startsWith("image/heic") || mimeType.startsWith("image/heif")) return "heic";
  return fallback;
}

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

/**
 * Run the full Phase-7 pipeline on a buffer. Returns the GalleryImageDoc
 * to persist to Firestore. Throws only on parse failure of the buffer.
 */
async function processBuffer(
  slug: string,
  imageId: string,
  buffer: Buffer
): Promise<GalleryImageDoc> {
  const baseSharp = sharp(buffer, { failOn: "none" });
  const meta = await baseSharp.metadata();
  const fullW = meta.width;
  const fullH = meta.height;
  if (typeof fullW !== "number" || typeof fullH !== "number") {
    throw new Error("Could not read image dimensions");
  }

  // Upload untouched original under canonical Phase-7 path.
  const ext = inferExt(meta.format);
  const originalObject = `rooms/${slug}/${imageId}/original.${ext}`;
  const originalContentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const originalUrl = await uploadBuffer(originalObject, buffer, originalContentType);

  // Pick targets that won't upscale.
  const longestEdge = Math.max(fullW, fullH);
  const targets = TARGET_LONGEST_EDGES.filter((e) => e <= longestEdge);
  if (targets.length === 0) targets.push(longestEdge);

  const avif: ImageVariantDoc[] = [];
  const webp: ImageVariantDoc[] = [];

  for (const longest of targets) {
    const resized = sharp(buffer, { failOn: "none" })
      .resize({ width: longest, height: longest, fit: "inside", withoutEnlargement: true })
      .withMetadata({});
    let actualW = longest;
    let actualH = Math.round((longest * fullH) / fullW);
    try {
      const rm = await resized.clone().metadata();
      if (typeof rm.width === "number") actualW = rm.width;
      if (typeof rm.height === "number") actualH = rm.height;
    } catch (err) {
      console.warn(`    ! metadata after resize failed at ${longest}px:`, err);
      continue;
    }
    try {
      const avifBuf = await resized.clone().avif({ quality: QUALITY }).toBuffer();
      const url = await uploadBuffer(`rooms/${slug}/${imageId}/${actualW}.avif`, avifBuf, "image/avif");
      avif.push({ url, width: actualW, height: actualH });
    } catch (err) {
      console.warn(`    ! avif ${actualW}px failed:`, err);
    }
    try {
      const webpBuf = await resized.clone().webp({ quality: QUALITY }).toBuffer();
      const url = await uploadBuffer(`rooms/${slug}/${imageId}/${actualW}.webp`, webpBuf, "image/webp");
      webp.push({ url, width: actualW, height: actualH });
    } catch (err) {
      console.warn(`    ! webp ${actualW}px failed:`, err);
    }
  }

  avif.sort((a, b) => a.width - b.width);
  webp.sort((a, b) => a.width - b.width);

  let blurDataURL: string | undefined;
  try {
    const blur = await sharp(buffer, { failOn: "none" })
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: BLUR_QUALITY })
      .toBuffer();
    blurDataURL = `data:image/jpeg;base64,${blur.toString("base64")}`;
  } catch (err) {
    console.warn(`    ! blur generation failed:`, err);
  }

  return {
    original: originalUrl,
    width: fullW,
    height: fullH,
    ...(blurDataURL ? { blurDataURL } : {}),
    ...(avif.length > 0 && webp.length > 0 ? { variants: { avif, webp } } : {}),
  };
}

async function processRoom(slug: string) {
  const ref = db().collection("rooms").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) {
    console.log(`  · ${slug}: no Firestore doc — nothing to do`);
    return { upgraded: 0, skipped: 0, failed: 0 };
  }
  const data = snap.data() ?? {};
  const rawGallery = data.gallery as RawGalleryEntry[] | undefined;
  const oldHero = typeof data.heroImage === "string" ? data.heroImage : "";

  if (!Array.isArray(rawGallery) || rawGallery.length === 0) {
    console.log(`  · ${slug}: empty gallery — nothing to do`);
    return { upgraded: 0, skipped: 0, failed: 0 };
  }

  // Map: old identity key → new key (after migration). Used to rewrite
  // heroImage if it pointed at a legacy URL that's now superseded.
  const keyRewrite = new Map<string, string>();

  const out: GalleryImageDoc[] = [];
  let upgraded = 0;
  let skipped = 0;
  let failed = 0;

  for (const raw of rawGallery) {
    const entry = normalizeEntry(raw);
    if (!entry) {
      failed += 1;
      continue;
    }
    if (entryHasVariants(entry)) {
      out.push(entry);
      skipped += 1;
      // No key change for already-migrated entries.
      keyRewrite.set(entryKey(entry), entryKey(entry));
      continue;
    }

    // Find the source URL — prefer `original`, fall back to `url`.
    const sourceUrl = entry.original ?? entry.url;
    if (!sourceUrl) {
      console.warn(`    ! ${slug}: entry missing both original and url — skipping`);
      failed += 1;
      out.push(entry);
      continue;
    }
    const oldKey = entryKey(entry);

    try {
      console.log(`    · ${slug} · downloading ${sourceUrl.split("/").pop()?.split("?")[0]}`);
      const bytes = await downloadBytes(sourceUrl);
      const imageId = randomUUID();
      const upgradedEntry = await processBuffer(slug, imageId, bytes);
      // Preserve alt if it was set.
      if (entry.alt) upgradedEntry.alt = entry.alt;
      out.push(upgradedEntry);
      upgraded += 1;
      keyRewrite.set(oldKey, entryKey(upgradedEntry));
      console.log(
        `      ✓ ${imageId}  ${upgradedEntry.variants?.avif.length ?? 0} avif + ${upgradedEntry.variants?.webp.length ?? 0} webp + ${upgradedEntry.blurDataURL ? "blur" : "no blur"}`
      );
    } catch (err) {
      console.warn(`    ! ${slug}: failed to process ${sourceUrl}:`, err);
      out.push(entry);
      failed += 1;
      keyRewrite.set(oldKey, oldKey);
    }
  }

  if (upgraded === 0 && failed === 0) {
    console.log(`  · ${slug}: all ${skipped} entries already migrated — no write`);
    return { upgraded, skipped, failed };
  }

  // Rewrite hero pointer if needed (the old hero URL may now have a new
  // identity key — the original URL post-migration).
  const newHero = oldHero ? (keyRewrite.get(oldHero) ?? oldHero) : oldHero;

  await ref.set(
    {
      gallery: out,
      ...(newHero ? { heroImage: newHero } : {}),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(
    `  ✓ ${slug}: wrote ${out.length} entries (${upgraded} upgraded, ${skipped} already migrated, ${failed} failed)`
  );
  return { upgraded, skipped, failed };
}

async function main() {
  console.log("Phase-7: migrating room galleries to multi-size AVIF/WebP shape\n");
  const snap = await db().collection("rooms").get();
  if (snap.empty) {
    console.log(
      "No rooms/* docs found. If gallery data only lives in content.ts " +
        "(no Firestore overrides yet), there's nothing to migrate."
    );
    return;
  }
  let totalUpgraded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  for (const doc of snap.docs) {
    const r = await processRoom(doc.id);
    totalUpgraded += r.upgraded;
    totalSkipped += r.skipped;
    totalFailed += r.failed;
  }
  console.log(
    `\nDone. ${totalUpgraded} upgraded · ${totalSkipped} already migrated · ${totalFailed} failed.`
  );
  console.log(
    "\nNote: originals from the previous Storage layout are NOT deleted — they remain in their old paths as a safety net. You can clean them up later via the Firebase Console once you've verified the new variants render correctly."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
