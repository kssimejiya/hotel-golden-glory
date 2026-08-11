/**
 * Encode the hotel promo video for web delivery.
 *
 * The source we were handed is a 4K broadcast master (3840x1920, ~23 Mbps,
 * 100 MB for 35 seconds). Nothing that heavy should ever reach a browser, so
 * this produces two H.264 variants plus a poster frame:
 *
 *   1920.mp4   1920x960, CRF 24  (~12 MB)  — desktop (>=1024px)
 *   1280.mp4   1280x640, CRF 25  (~6 MB)   — mobile / tablet
 *   poster.png full-res still, fed to sharp by upload-promo-video.ts
 *
 * The mobile variant exists because the desktop one averages ~2.8 Mbps, which
 * buffers on a weak mobile connection. At ~1.4 Mbps the mobile variant streams
 * comfortably.
 *
 * `-movflags +faststart` is NOT optional — it moves the moov atom to the front
 * of the file so playback can begin before the download finishes. Without it a
 * click-to-play video sits on a blank frame until the whole file lands.
 *
 * Outputs go to .video-build/ (gitignored). Idempotent: existing outputs are
 * left alone, so re-running is cheap. Pass --force to re-encode.
 *
 * Run with:
 *   npm run video:encode -- [path-to-source.mp4] [--force] [--poster-at=3]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const DEFAULT_SOURCE = resolve(homedir(), "Downloads/hotle.mp4");
const OUT_DIR = resolve(process.cwd(), ".video-build");

/** Poster frame timestamp, in seconds. 3s lands on the lit exterior. */
const DEFAULT_POSTER_AT = 3;

interface Variant {
  name: string;
  width: number;
  crf: number;
}

const VARIANTS: Variant[] = [
  { name: "1920.mp4", width: 1920, crf: 24 },
  { name: "1280.mp4", width: 1280, crf: 25 },
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const posterArg = argv.find((a) => a.startsWith("--poster-at="));
  const posterAt = posterArg
    ? Number(posterArg.split("=")[1])
    : DEFAULT_POSTER_AT;
  const source = argv.find((a) => !a.startsWith("--")) ?? DEFAULT_SOURCE;
  if (!Number.isFinite(posterAt) || posterAt < 0) {
    throw new Error(`--poster-at must be a non-negative number, got ${posterArg}`);
  }
  return { force, posterAt, source: resolve(source) };
}

function requireFfmpeg(): void {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    try {
      execFileSync(bin, ["-version"], { stdio: "ignore" });
    } catch {
      throw new Error(
        `${bin} not found on PATH. Install it first:  brew install ffmpeg`
      );
    }
  }
}

function probeDuration(source: string): number {
  const out = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      source,
    ],
    { encoding: "utf8" }
  );
  const seconds = Number(out.trim());
  if (!Number.isFinite(seconds)) {
    throw new Error(`Could not read duration from ${source}`);
  }
  return seconds;
}

function mb(path: string): string {
  return `${(statSync(path).size / 1_000_000).toFixed(1)} MB`;
}

function encodeVariant(source: string, v: Variant, force: boolean): void {
  const out = resolve(OUT_DIR, v.name);
  if (existsSync(out) && !force) {
    console.log(`  = ${v.name}  (exists, ${mb(out)} — pass --force to redo)`);
    return;
  }
  console.log(`  ↻ ${v.name}  encoding at ${v.width}px, CRF ${v.crf}…`);
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-y",
      "-i", source,
      // -2 keeps the height even, which yuv420p requires.
      "-vf", `scale=${v.width}:-2`,
      "-c:v", "libx264",
      "-profile:v", "high",
      "-crf", String(v.crf),
      "-preset", "slow",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      out,
    ],
    { stdio: "inherit" }
  );
  console.log(`  ✓ ${v.name}  ${mb(out)}`);
}

function extractPoster(source: string, at: number, force: boolean): void {
  const out = resolve(OUT_DIR, "poster.png");
  if (existsSync(out) && !force) {
    console.log(`  = poster.png  (exists, ${mb(out)} — pass --force to redo)`);
    return;
  }
  console.log(`  ↻ poster.png  frame at ${at}s…`);
  execFileSync(
    "ffmpeg",
    // -ss before -i seeks fast; we want a full-resolution still here because
    // upload-promo-video.ts derives every AVIF/WebP size from it.
    ["-v", "error", "-y", "-ss", String(at), "-i", source, "-frames:v", "1", out],
    { stdio: "inherit" }
  );
  console.log(`  ✓ poster.png  ${mb(out)}`);
}

function main(): void {
  const { force, posterAt, source } = parseArgs();

  requireFfmpeg();
  if (!existsSync(source)) {
    throw new Error(
      `Source video not found: ${source}\n` +
        `Pass the path explicitly:  npm run video:encode -- /path/to/video.mp4`
    );
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const duration = probeDuration(source);
  console.log(`Source:   ${source}  (${mb(source)}, ${duration.toFixed(3)}s)`);
  console.log(`Output:   ${OUT_DIR}\n`);

  if (posterAt > duration) {
    throw new Error(
      `--poster-at=${posterAt} is past the end of the video (${duration.toFixed(1)}s)`
    );
  }

  for (const v of VARIANTS) encodeVariant(source, v, force);
  extractPoster(source, posterAt, force);

  console.log(
    `\nDuration is ${duration.toFixed(3)}s — set durationSeconds in content.ts to match.`
  );
  console.log("Next:  npm run video:upload");
}

main();
