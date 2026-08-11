/**
 * Upload the encoded promo video + poster to Firebase Storage and print the
 * `promoVideo` block to paste into src/lib/content.ts.
 *
 * Why Storage and not /public: the bucket is a modern *.firebasestorage.app
 * bucket, whose no-cost tier covers 100 GB/month of downloads — roughly 12,000
 * plays of this video. App Hosting bills the same bytes as cached outbound
 * bandwidth at $0.15/GiB with no free allowance. Storage also keeps a 12 MB
 * binary out of git and lets the video be swapped without a redeploy.
 *
 * The poster goes through the same sharp AVIF/WebP treatment as room images
 * (see upload-static-images.ts) so it renders through <SmartImage> on the
 * <picture> path, with a blur placeholder. We deliberately do NOT use the
 * native <video poster> attribute — it takes a single URL with no content
 * negotiation, so it would ship one oversized JPEG to every device.
 *
 * Every object is written with an immutable Cache-Control. Firebase Storage
 * sets no useful default, and repeat visitors re-downloading a 12 MB file is
 * the one realistic way to burn through the free tier.
 *
 * Idempotent in the sense that each run writes a fresh <uuid> prefix, so the
 * old objects stay until deleted — that is the cache-busting mechanism, same
 * as room images. Re-running gives you new URLs to paste.
 *
 * Run with:
 *   npm run video:upload
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { storage, bucketName } from "./lib/init-admin";

if (!bucketName) {
  throw new Error(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set in .env.local — see .env.local.example"
  );
}

const bucket = storage().bucket(bucketName);

const BUILD_DIR = resolve(process.cwd(), ".video-build");
const FIREBASE_HOST = "firebasestorage.googleapis.com";

// Mirrors upload-static-images.ts so the poster matches room-image quality.
const QUALITY = 90;
const BLUR_WIDTH = 20;
const BLUR_QUALITY = 40;
const TARGET_LONGEST_EDGES = [2400, 1600, 1024, 640];

const VIDEO_FILES = [
  { file: "1920.mp4", key: "desktop" as const },
  { file: "1280.mp4", key: "mobile" as const },
];

interface ImageVariantDoc {
  url: string;
  width: number;
  height: number;
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

function requireBuildFile(name: string): string {
  const path = resolve(BUILD_DIR, name);
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${name} in .video-build/ — run \`npm run video:encode\` first.`
    );
  }
  return path;
}

async function uploadPoster(prefix: string) {
  const buffer = readFileSync(requireBuildFile("poster.png"));
  const meta = await sharp(buffer, { failOn: "none" }).metadata();
  const fullW = meta.width;
  const fullH = meta.height;
  if (typeof fullW !== "number" || typeof fullH !== "number") {
    throw new Error("Could not read poster dimensions");
  }

  // Archive a JPEG original — the PNG straight out of ffmpeg is ~4 MB and
  // nothing renders it directly; it only exists as the variant source.
  const originalBuf = await sharp(buffer, { failOn: "none" })
    .jpeg({ quality: QUALITY })
    .toBuffer();
  const original = await uploadBuffer(
    `${prefix}/poster-original.jpg`,
    originalBuf,
    "image/jpeg"
  );
  console.log(`    ↑ poster-original.jpg  (${fullW}x${fullH})`);

  const avif: ImageVariantDoc[] = [];
  const webp: ImageVariantDoc[] = [];
  const longest = Math.max(fullW, fullH);
  const targets = TARGET_LONGEST_EDGES.filter((e) => e <= longest);
  if (targets.length === 0) targets.push(longest);

  for (const t of targets) {
    const resized = sharp(buffer, { failOn: "none" })
      .resize({ width: t, height: t, fit: "inside", withoutEnlargement: true })
      .withMetadata({});

    // NOTE: sharp's .metadata() describes the INPUT image, not the result of a
    // queued resize — asking it here would report 3840x1920 for every target,
    // collapsing all four variants onto one filename and lying in the srcset.
    // `toBuffer({ resolveWithObject: true })` returns the real output dims.
    try {
      const { data, info } = await resized
        .clone()
        .avif({ quality: QUALITY })
        .toBuffer({ resolveWithObject: true });
      const url = await uploadBuffer(
        `${prefix}/poster-${info.width}.avif`,
        data,
        "image/avif"
      );
      avif.push({ url, width: info.width, height: info.height });
      console.log(`    ↑ poster-${info.width}.avif  (${info.width}x${info.height})`);
    } catch (err) {
      console.warn(`    ! avif ${t} failed:`, err);
    }
    try {
      const { data, info } = await resized
        .clone()
        .webp({ quality: QUALITY })
        .toBuffer({ resolveWithObject: true });
      const url = await uploadBuffer(
        `${prefix}/poster-${info.width}.webp`,
        data,
        "image/webp"
      );
      webp.push({ url, width: info.width, height: info.height });
      console.log(`    ↑ poster-${info.width}.webp  (${info.width}x${info.height})`);
    } catch (err) {
      console.warn(`    ! webp ${t} failed:`, err);
    }
  }

  avif.sort((a, b) => a.width - b.width);
  webp.sort((a, b) => a.width - b.width);

  let blurDataURL: string | undefined;
  try {
    const blurBuf = await sharp(buffer, { failOn: "none" })
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: BLUR_QUALITY })
      .toBuffer();
    blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;
  } catch {}

  return {
    original,
    width: fullW,
    height: fullH,
    ...(blurDataURL ? { blurDataURL } : {}),
    ...(avif.length > 0 && webp.length > 0 ? { variants: { avif, webp } } : {}),
  };
}

async function main() {
  const videoId = randomUUID();
  const prefix = `videos/promo/${videoId}`;
  console.log(`Uploading to gs://${bucket.name}/${prefix}\n`);

  const sources: Record<string, string> = {};
  for (const { file, key } of VIDEO_FILES) {
    const buffer = readFileSync(requireBuildFile(file));
    sources[key] = await uploadBuffer(`${prefix}/${file}`, buffer, "video/mp4");
    console.log(
      `    ↑ ${file}  (${(buffer.byteLength / 1_000_000).toFixed(1)} MB)`
    );
  }

  const poster = await uploadPoster(prefix);

  console.log("\n─── paste into src/lib/content.ts ───\n");
  console.log(
    `export const promoVideo = ${JSON.stringify(
      {
        sources,
        poster,
        durationSeconds: 34.783,
        eyebrow: "Property Tour",
        heading: "See It For Yourself",
        body:
          "Thirty-five seconds through the building — the lit facade at night, " +
          "the reception desk, the rooms, and the restaurant. No stock photography, " +
          "no borrowed interiors. This is the hotel you will actually walk into.",
        alt: "Hotel Golden Glory at night, its facade lit in warm gold",
      },
      null,
      2
    )} as const;\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
