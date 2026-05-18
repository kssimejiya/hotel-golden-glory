import "server-only";
import sharp, { type Sharp } from "sharp";
import { randomUUID } from "node:crypto";
import { adminBucket } from "@/lib/firebase/admin";
import type { GalleryImage, ImageVariant, RoomSlug } from "@/types";

/**
 * Phase-7 image processing pipeline.
 *
 * Single entrypoint: processGalleryImage(buffer, slug, imageId?) →
 *   - Reads intrinsic dimensions
 *   - Uploads the untouched original (archived, never served to the web)
 *   - For each applicable target longest-edge size, generates AVIF + WebP via
 *     sharp at quality 90, uploads each, collects ImageVariant entries
 *   - Generates a ~20px base64 blur placeholder (jpeg quality 40)
 *   - Returns a fully-populated GalleryImage
 *
 * Failure modes (intentional — never lose an upload):
 *   - Single variant fails to encode or upload → logged, the rest continue.
 *     The returned GalleryImage just has fewer variants. As long as at least
 *     one webp variant exists, SmartImage renders <picture>.
 *   - sharp metadata() fails entirely → caller should fall back to storing
 *     a legacy { url } entry pointing at the raw upload.
 *
 * Encoding settings (do not change without bumping a phase):
 *   - quality 90 for both AVIF and WebP (visually lossless tier)
 *   - fit: inside, withoutEnlargement: true (never upscale)
 *   - .withMetadata(false): strip EXIF for size + privacy on web variants
 *
 * Storage layout:
 *   rooms/{slug}/{imageId}/original.{ext}
 *   rooms/{slug}/{imageId}/{width}.avif
 *   rooms/{slug}/{imageId}/{width}.webp
 */

const QUALITY = 90;
const BLUR_WIDTH = 20;
const BLUR_QUALITY = 40;

/** Longest-edge caps, descending. Sharp's fit:inside scales the longest edge. */
const TARGET_LONGEST_EDGES: number[] = [2400, 1600, 1024, 640];

const FIREBASE_HOST = "firebasestorage.googleapis.com";

function inferExt(mimeType: string | undefined, fallback = "jpg"): string {
  if (!mimeType) return fallback;
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/heic" || mimeType === "image/heif") return "heic";
  return fallback;
}

function buildFirebaseUrl(
  bucketName: string,
  objectName: string,
  token: string
): string {
  return `https://${FIREBASE_HOST}/v0/b/${bucketName}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
}

async function uploadVariantBuffer(
  bucket: ReturnType<typeof adminBucket>,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const token = randomUUID();
  await bucket.file(objectName).save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      // Strong cache + immutable: every variant URL is content-addressed by
      // {imageId}/{width}.{format}; the imageId is unique per upload so any
      // edit becomes a new URL. Safe to cache aggressively at the CDN edge.
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return buildFirebaseUrl(bucket.name, objectName, token);
}

interface ProcessOptions {
  /** Stable image identity. Defaults to a fresh UUID for new uploads; pass an existing id for migrations. */
  imageId?: string;
  /** MIME type of the original buffer. Used to pick the original's extension. */
  contentType?: string;
  /** Optional alt text to carry through into the returned GalleryImage. */
  alt?: string;
  /** If false, skip uploading the original (e.g. migration where original already lives in Storage). */
  uploadOriginal?: boolean;
  /** When uploadOriginal is false, the existing original URL to record on the returned object. */
  existingOriginalUrl?: string;
}

export interface ProcessResult {
  image: GalleryImage;
  /**
   * Encoding/upload diagnostics. `succeeded` is the count of successful
   * variant uploads (AVIF + WebP combined); `attempted` is the number we
   * tried. A successful image has at least 1 succeeded webp variant.
   */
  attempted: number;
  succeeded: number;
  failed: number;
}

/**
 * Main entrypoint. Throws ONLY when sharp can't even parse the buffer
 * (cannot extract metadata) — the caller is then expected to fall back to a
 * legacy { url } entry. Per-variant failures are swallowed and logged.
 */
export async function processGalleryImage(
  buffer: Buffer,
  slug: RoomSlug,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const imageId = options.imageId ?? randomUUID();
  const baseSharp = sharp(buffer, { failOn: "none" });

  const meta = await baseSharp.metadata();
  const fullWidth = meta.width;
  const fullHeight = meta.height;
  if (typeof fullWidth !== "number" || typeof fullHeight !== "number") {
    throw new Error("Could not read image dimensions");
  }

  const bucket = adminBucket();

  // 1. Upload (or record) the untouched original.
  let originalUrl = options.existingOriginalUrl ?? "";
  if (options.uploadOriginal !== false) {
    const ext = inferExt(options.contentType ?? meta.format);
    const originalObject = `rooms/${slug}/${imageId}/original.${ext}`;
    try {
      originalUrl = await uploadVariantBuffer(
        bucket,
        originalObject,
        buffer,
        options.contentType ?? `image/${ext === "jpg" ? "jpeg" : ext}`
      );
    } catch (err) {
      console.error(
        `[processGalleryImage] failed to upload original for ${slug}/${imageId}:`,
        err
      );
      throw new Error("Failed to upload original");
    }
  }
  if (!originalUrl) {
    throw new Error("No original URL — uploadOriginal=false requires existingOriginalUrl");
  }

  // 2. Decide which target sizes to actually generate. Never upscale.
  const longestEdge = Math.max(fullWidth, fullHeight);
  const targets = TARGET_LONGEST_EDGES.filter((edge) => edge <= longestEdge);
  // ALWAYS keep at least the full size — if every cap exceeds the original,
  // emit one variant at the original's longest edge (still encoded fresh in
  // AVIF/WebP at quality 90, which is the point of this pipeline).
  if (targets.length === 0) {
    targets.push(longestEdge);
  }

  // 3. For each (size × format), encode + upload. Per-job try/catch so one
  // failure doesn't tank the rest.
  const avif: ImageVariant[] = [];
  const webp: ImageVariant[] = [];
  let attempted = 0;
  let succeeded = 0;
  let failed = 0;

  for (const longestTarget of targets) {
    // sharp's fit:inside on { width: longestTarget } only constrains the
    // width axis. For landscape that gives the right answer; for portrait
    // we want to constrain height. Setting BOTH width and height to the
    // longest-edge cap + fit:inside picks the smaller scaling, which is
    // exactly the longest-edge behavior we want.
    const resized: Sharp = sharp(buffer, { failOn: "none" })
      .resize({
        width: longestTarget,
        height: longestTarget,
        fit: "inside",
        withoutEnlargement: true,
      })
      .withMetadata({});

    // After resize, get actual emitted dimensions so the srcset is accurate.
    let actualMeta;
    try {
      actualMeta = await resized.clone().metadata();
    } catch (err) {
      console.warn(
        `[processGalleryImage] metadata after resize failed for ${imageId} @ ${longestTarget}:`,
        err
      );
      failed += 2;
      attempted += 2;
      continue;
    }
    const actualW =
      typeof actualMeta.width === "number" ? actualMeta.width : longestTarget;
    const actualH =
      typeof actualMeta.height === "number"
        ? actualMeta.height
        : Math.round((longestTarget * fullHeight) / fullWidth);

    // --- AVIF ---
    attempted += 1;
    try {
      const avifBuffer = await resized.clone().avif({ quality: QUALITY }).toBuffer();
      const objectName = `rooms/${slug}/${imageId}/${actualW}.avif`;
      const url = await uploadVariantBuffer(bucket, objectName, avifBuffer, "image/avif");
      avif.push({ url, width: actualW, height: actualH });
      succeeded += 1;
    } catch (err) {
      console.warn(
        `[processGalleryImage] AVIF ${actualW}px failed for ${imageId}:`,
        err
      );
      failed += 1;
    }

    // --- WebP ---
    attempted += 1;
    try {
      const webpBuffer = await resized.clone().webp({ quality: QUALITY }).toBuffer();
      const objectName = `rooms/${slug}/${imageId}/${actualW}.webp`;
      const url = await uploadVariantBuffer(bucket, objectName, webpBuffer, "image/webp");
      webp.push({ url, width: actualW, height: actualH });
      succeeded += 1;
    } catch (err) {
      console.warn(
        `[processGalleryImage] WebP ${actualW}px failed for ${imageId}:`,
        err
      );
      failed += 1;
    }
  }

  // Sort ascending by width — browsers picking from srcset are happy either
  // way but ascending order matches the srcset spec convention.
  avif.sort((a, b) => a.width - b.width);
  webp.sort((a, b) => a.width - b.width);

  // 4. Blur placeholder — separate try/catch since blur failure shouldn't
  // sink an otherwise-successful upload.
  let blurDataURL: string | undefined;
  try {
    const blurBuffer = await sharp(buffer, { failOn: "none" })
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: BLUR_QUALITY })
      .toBuffer();
    blurDataURL = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;
  } catch (err) {
    console.warn(`[processGalleryImage] blur generation failed for ${imageId}:`, err);
  }

  const image: GalleryImage = {
    original: originalUrl,
    ...(blurDataURL ? { blurDataURL } : {}),
    width: fullWidth,
    height: fullHeight,
    ...(options.alt ? { alt: options.alt } : {}),
    // Only emit variants if BOTH formats have at least one entry — partial
    // variants would force browsers to fall back to the <img> src across
    // formats inconsistently. Cleaner to skip <picture> entirely in that case.
    ...(avif.length > 0 && webp.length > 0 ? { variants: { avif, webp } } : {}),
  };

  return { image, attempted, succeeded, failed };
}
