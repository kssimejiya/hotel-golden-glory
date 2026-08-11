# Promo Video Showcase — Design

**Date:** 2026-08-11
**Status:** Approved for planning

## Goal

Add the 35-second hotel promo video to the public website as a click-to-play
showcase section with audio, served cheaply and without third-party branding.

## Source Material

`hotle.mp4` (currently at `~/Downloads/hotle.mp4`, not in git):

| Property | Value |
|---|---|
| Resolution | 3840 × 1920 (2:1) |
| Duration | 34.783 s |
| Video | H.264, 30 fps |
| Audio | AAC, stereo, 44.1 kHz, 193 kbps |
| Size / bitrate | 100.7 MB @ 23 Mbps |

It is a 4K master at broadcast bitrate. Every decision below follows from the
fact that re-encoding for web removes ~90% of the weight, which takes the
"video is too heavy to self-host" problem off the table entirely.

## Decisions

### Playback model: click-to-play, audio preserved

A poster frame with a play button. The video downloads only when a visitor
actually clicks. Visitors who don't click pay nothing beyond one poster image.

Rejected: silent autoplay hero background loop. It would load for 100% of
visitors, and it cannot carry the audio track, which we are keeping.

### Delivery: Firebase Storage, not `/public`

The bucket `hotelgoldenglory-79cab.firebasestorage.app` is a **modern** bucket.
Its no-cost tier is 100 GB/month downloaded, 5 GB stored, 50K download
ops/month.

At ~8 MB average per play, 100 GB/month is roughly **12,000 plays/month** at no
cost. Storage of ~18 MB against 5 GB is a rounding error.

Serving the same file from `/public` via App Hosting would be billed as
**cached** outbound bandwidth at **$0.15/GiB with no free allowance** — about
$1.20/month at 1,000 plays, $6/month at 5,000.

| Plays/month | `/public` via App Hosting | Firebase Storage |
|---|---|---|
| 500 | ~$0.60 | $0 |
| 1,000 | ~$1.20 | $0 |
| 5,000 | ~$6.00 | $0 |
| 12,000 | ~$14.40 | $0 (edge of free tier) |

Storage also keeps a 12 MB binary out of git, allows replacing the video
without a redeploy, and reuses the upload pipeline already built for room
images. The stronger edge caching of App Hosting is worth well under a dollar a
month here and does not justify the cost.

Rejected: YouTube unlisted embed. It has two real advantages — adaptive bitrate
and discoverability on YouTube itself — but a full embed pulls ~700 KB–1 MB of
iframe JS, sets cookies, and hands the final frame to YouTube's end-screen
suggestions. Publishing to YouTube separately as a marketing channel remains
worthwhile and is out of scope here.

### Encoding: two H.264 variants

Measured on the real file, not estimated:

| Variant | Settings | Size | Avg bitrate |
|---|---|---|---|
| Desktop | 1920 × 960, CRF 24 | 12.4 MB | ~2.8 Mbps |
| Mobile | 1280 × 640, CRF 25 | 6.1 MB | ~1.4 Mbps |

Both: `libx264 -profile:v high -preset slow -pix_fmt yuv420p`, audio
`aac -b:a 128k`, and **`-movflags +faststart`** so the moov atom sits at the
front of the file and playback begins before the download completes.

The mobile variant exists specifically because the desktop file at 2.8 Mbps
would buffer on a weak mobile connection. At 1.4 Mbps the mobile variant
streams comfortably.

Rejected: HLS/DASH adaptive bitrate. Two fixed variants cover the range for a
35-second clip without a packaging pipeline or a JS player library.

### Poster: reuse the existing image pipeline

Extract a single frame with ffmpeg, then run it through the same `sharp`
AVIF/WebP multi-size treatment as `scripts/upload-static-images.ts`, producing
a `GalleryImage` shape (`original` + `variants.avif[]` + `variants.webp[]` +
`blurDataURL`).

The component renders this through `SmartImage` in fill mode rather than using
the native `<video poster>` attribute. `poster` accepts a single URL with no
content negotiation; `SmartImage` gives AVIF/WebP, a blur placeholder, and
error handling for free, and matches how every other image on the site renders.

## Architecture

### Storage layout

```
videos/promo/<uuid>/1920.mp4
videos/promo/<uuid>/1280.mp4
videos/promo/<uuid>/poster-original.jpg
videos/promo/<uuid>/poster-{2400,1600,1024,640}.{avif,webp}
```

The `<uuid>` segment gives free cache-busting when the video is replaced,
matching the convention already used for room images.

All objects upload with
`cacheControl: "public, max-age=31536000, immutable"` — the same metadata
`uploadBuffer` already sets in `scripts/upload-static-images.ts`. Without this
Firebase Storage does not set a useful `Cache-Control`, and repeat visitors
re-download the file, which is the one thing that could realistically push
traffic toward the 100 GB line.

### Storage rules

Add to `storage.rules`, mirroring the existing `rooms/**` block:

```
match /videos/{allPaths=**} {
  allow read: if true;
  allow write: if isAdmin();
}
```

Deploy with `firebase deploy --only storage`. The Firebase CLI must be
authenticated as `hotelgoldenglory@gmail.com`; other accounts get 403.

### Content model

Add a `promoVideo` export to `src/lib/content.ts`, alongside the other static
content (`amenities`, `testimonials`). It is not stored in Firestore and is not
admin-editable — the video changes at most once a year, and adding it to the
admin surface is unjustified for that cadence.

```ts
export const promoVideo = {
  sources: { desktop: string; mobile: string },
  poster: GalleryImage,
  durationSeconds: 34.783,
  eyebrow: string,
  heading: string,
  body: string,
  alt: string,
};
```

`next.config.ts` needs **no change** — `*.firebasestorage.app` is already in
`images.remotePatterns`, which covers the poster.

### Component

`src/components/sections/VideoShowcase.tsx`, a `"use client"` component
following the idiom established by `ReceptionPreview.tsx`: `Container`,
`Reveal`, framer-motion with `sectionStaggerVariants` / `sectionItemVariants` /
`viewportConfig`, `useReducedMotion`, and the `gold` / `charcoal` / `soft-gray`
tokens.

Two states inside a `aspect-[2/1]` container matching the source's 2:1 ratio:

1. **Idle** — `SmartImage` poster in fill mode, overlaid by a real `<button>`
   with a gold play affordance and an accessible label ("Play the Hotel Golden
   Glory tour video, 35 seconds"). A `<button>` rather than a click handler on
   a div, so keyboard and screen-reader users get it for free.
2. **Playing** — `<video controls autoPlay playsInline preload="auto">` with
   `src` set to the selected variant.

**Variant selection happens inside the click handler, not during render:**

```ts
const src = window.matchMedia("(min-width: 1024px)").matches
  ? promoVideo.sources.desktop
  : promoVideo.sources.mobile;
```

Because playback is click-initiated, the choice is made at click time. Reading
`window` during render would cause a hydration mismatch; reading it in the
handler cannot.

`useReducedMotion` gates the section's scroll-entrance animation only. It does
not suppress the video, which is user-initiated and therefore not covered by
the reduced-motion contract.

### Placement

Homepage (`src/app/(public)/page.tsx`), between `RoomCategoriesPreview` and
`AmenitiesGrid`.

Sampling the footage settled this. The video is a full property tour —
exterior at 0-4s, reception at 8s, lounge at 12s, guest rooms at 16-24s,
restaurant at 28-32s. It traverses the same narrative as the whole homepage in
35 seconds, which rules out placing it late: by the time a visitor has read the
Amenities, Reception, and Dining sections, a video showing those same spaces is
redundant. Its value is highest *before* the detail, not after.

It goes after Rooms rather than before because Rooms is the conversion path and
should not be pushed down. A visitor who has just scanned room cards as stills
is at peak "show me the real thing" — which is exactly what the video answers.
It then bridges into Amenities/Reception/Dining, each of which it has just
previewed.

The section is `bg-charcoal`, against `bg-cream` above and `bg-white` below.
Dark is the correct surround for video — it makes footage read as footage
rather than as another photo card — and it breaks up a page that is otherwise
an unrelieved run of cream and white.

This is a one-line import and one-line JSX change, trivial to move later.

### Structured data

Add a `VideoObject` JSON-LD block. `src/app/layout.tsx` already emits
`hotelJsonLd` sitewide; this one belongs on the homepage only, since that is
where the video lives.

Fields: `name`, `description`, `thumbnailUrl` (poster original), `contentUrl`
(desktop variant), `uploadDate`, and `duration` as ISO 8601 (`PT35S` —
34.783 s rounded, as schema.org durations are whole seconds by convention).

## Scripts

### `npm run video:encode -- <path-to-source>`

`scripts/encode-promo-video.ts`. Shells out to `ffmpeg`, writes both variants
and the extracted poster frame into `website/.video-build/`, which is added to
`.gitignore` as part of this work so the intermediates never reach git.
Defaults the source path to `~/Downloads/hotle.mp4`. Idempotent — skips any
output that already exists. Fails with a clear message if `ffmpeg` is not on
`PATH`. Prints the resulting file sizes.

Encoding is a script rather than a documented manual command so the exact
settings are reproducible when the video is replaced.

### `npm run video:upload`

`scripts/upload-promo-video.ts`. Reads `website/.video-build/`, uploads the two
MP4s and the full poster variant set, and prints a ready-to-paste `promoVideo`
block for `content.ts`.

It follows the `uploadBuffer` / `buildUrl` pattern from
`upload-static-images.ts` (download token, `resumable: false`, immutable
`cacheControl`) and reuses `scripts/lib/init-admin.ts` for credentials. It does
**not** rewrite `content.ts` automatically — printing the block for a manual
paste is simpler than codemodding a TypeScript literal, and the operation runs
about once a year.

**sharp gotcha, hit during implementation:** `sharp(...).resize(...).metadata()`
reports the dimensions of the *input* image, not the queued resize. Using it to
name variants labelled all four poster sizes `3840`, collapsing them onto one
filename and putting false widths in the srcset. The fix is
`toBuffer({ resolveWithObject: true })`, whose `info.width` / `info.height` are
the real output dimensions.

`scripts/upload-static-images.ts` uses that same `.metadata()` pattern and
would produce the same collapsed variants if run. Nothing is affected today —
the bucket currently holds no objects under `rooms/`, so that migration has
evidently never been run against it — but the script should be fixed the same
way before it ever is.

## Testing

Automated:
- `npm run typecheck` and `npm run lint` pass.

Manual verification, all of which must be observed rather than assumed:
- Poster renders before any click; no video bytes in the Network tab until the
  button is pressed.
- Desktop viewport (≥1024px) requests `1920.mp4`; narrower viewport requests
  `1280.mp4`.
- Audio plays.
- `curl -I` on both object URLs returns
  `Cache-Control: public, max-age=31536000, immutable`.
- No layout shift when the poster is replaced by the video (the `aspect-[2/1]`
  wrapper holds the box).
- Keyboard: the play affordance is reachable by Tab and activates on Enter and
  Space.
- `prefers-reduced-motion: reduce` suppresses the entrance animation but leaves
  playback working.

## Resolved: Captions

The audio is instrumental music only, confirmed by the owner. No WebVTT
captions track is required.

## Known Issue: Burned-In Contact Overlay

The source video carries a permanent graphic overlay on every frame: the Hotel
Golden Glory logo (top-left), The Blues logo (top-right), and a contact card
(bottom-right) with both phone numbers, a QR code, the postal address, and an
email address. It was cut for WhatsApp/social distribution, not for the
hotel's own site.

Two of those burned-in details disagree with `src/lib/content.ts`:

| Field | Video overlay | `hotelInfo` |
|---|---|---|
| Landmark | `B/H BHADLAWALA PETROL PUMP` | `B/h Bhutkhana Petrol Pump` |
| Email | `reservations.goldenglory@theblueshotels.com` | `reservations@hotelgoldenglory.com` |

These cannot be fixed in code — they are pixels. Cropping them out is not
viable either: they occupy three corners, so a safe crop is roughly
2670x990 out of 3840x1920, which destroys the framing of shots composed for
the full frame.

The real fix is a clean re-export from whoever produced the video. Swapping it
in is cheap — re-run `npm run video:encode && npm run video:upload` and paste
the new URLs into `promoVideo`. Until then the overlay is visible during
playback, and the section's duration badge is deliberately bottom-**left** so
it does not collide with the contact card.

Separately, the address discrepancy is worth resolving regardless of the
video, since one of the two spellings is wrong on the live site.

## Non-Goals

- Silent autoplay hero background loop.
- Adaptive bitrate streaming (HLS/DASH).
- Admin-editable video upload through the existing admin surface.
- Publishing to YouTube (worth doing as marketing, separately).
- A gallery of multiple videos. This is one video.
