"use client";

import { useCallback, useState, type CSSProperties } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "./Shimmer";
import type { GalleryImage, ImageVariant } from "@/types";

/**
 * SmartImage — picks the cheapest correct render path for an image and
 * supports two LAYOUT modes:
 *
 *   FILL MODE (caller passes `fill`):
 *     - Image fills its caller-provided positioned parent (the parent must
 *       be `position: relative` AND establish a height — typically via
 *       `aspect-[…]`). NO width/height attrs on the underlying element —
 *       next/image forbids `fill + width`, and on raw <img> the CSS
 *       `width: 100%; height: 100%` already controls layout.
 *     - All overlays (blur underlay, shimmer, error tile) are `absolute
 *       inset-0` against the caller's parent.
 *
 *   FIXED MODE (caller passes `width` and `height`, NO `fill`):
 *     - Intrinsic width/height drive layout. SmartImage wraps everything in
 *       a `position: relative inline-block` span so the overlays still have
 *       a positioning context (the caller's parent isn't required to be
 *       positioned in fixed mode).
 *
 * The two modes are mutually exclusive. The caller picks one; SmartImage
 * never mixes them — that's what caused the "fill + width" runtime error
 * we fixed in this rev.
 *
 * Three RENDER paths (independent of mode):
 *
 *   PREMIUM (Phase-7): `image.variants` present → native <picture> with AVIF
 *   + WebP sources straight from the Firebase Storage CDN. Bypasses
 *   /_next/image. The fallback <img> is what the browser actually renders.
 *
 *   LEGACY: `image.variants` absent → next/image on `image.url` (or
 *   `image.original`). Pre-Phase-7 entries take this path until migrated.
 *
 *   LOCAL: caller passes `src` instead of `image` (Hero / DiningPreview),
 *   with a bundled blurDataURL. Renders via next/image.
 *
 * Shared UX overlays (every path, every mode):
 *   - blur placeholder underlay when blurDataURL is present
 *   - shimmer skeleton when not
 *   - opacity 0 → 1 fade-in (500ms) on load
 *   - cream + ImageOff tile on error
 *   - cached-image rescue via ref callback's img.complete check
 *   - reduced-motion handled by shimmer/keyframes in globals.css
 */

// next/image-compatible props the LEGACY/LOCAL paths forward through.
// Strip `placeholder` + `blurDataURL` (we manage them ourselves based on
// effectiveBlur) and `src` (we resolve our own effectiveSrc).
type ForwardedImageProps = Omit<ImageProps, "placeholder" | "blurDataURL" | "src">;

export interface SmartImageProps extends ForwardedImageProps {
  /** Phase-7 GalleryImage. Preferred — enables the <picture> path when variants are present. */
  image?: GalleryImage;
  /** Local-image src (Hero/DiningPreview). One of `image` or `src` must be set. */
  src?: ImageProps["src"];
  /** Override blur if you want it (local images bundle their own). */
  blurDataURL?: string;
  /** Container className applied to the wrapping div (shimmer/error live here). */
  wrapperClassName?: string;
}

function pickLargestWebpUrl(variants: GalleryImage["variants"]): string | null {
  if (!variants || variants.webp.length === 0) return null;
  return variants.webp[variants.webp.length - 1]!.url;
}

function srcSet(variants: ImageVariant[]): string {
  return variants.map((v) => `${v.url} ${v.width}w`).join(", ");
}

export function SmartImage({
  alt,
  image,
  src,
  blurDataURL,
  wrapperClassName,
  className,
  onLoad,
  onError,
  sizes,
  // Mode-determining props — explicitly destructured OUT of `rest` so they
  // can NEVER leak via {...rest} and accidentally conflict with the
  // mutually-exclusive ones we set deliberately below.
  fill,
  width,
  height,
  preload,
  loading,
  // Destructured so the <picture> path can honour it — {...rest} is only
  // spread on the next/image path, so otherwise a caller-supplied value would
  // be silently dropped here. Lets a caller load an image early WITHOUT
  // giving it high priority, which matters when it would otherwise compete
  // with the page's LCP element.
  fetchPriority,
  ...rest
}: SmartImageProps) {
  // ── MODE: fill vs fixed (mutually exclusive) ───────────────────
  const isFill = !!fill;
  // Intrinsic dims are ONLY consulted in fixed mode. Caller's explicit
  // width wins, then the GalleryImage's intrinsic width.
  const intrinsicWidth = isFill ? undefined : (width ?? image?.width);
  const intrinsicHeight = isFill ? undefined : (height ?? image?.height);

  // ── PATH: variants vs legacy vs local ──────────────────────────
  const variants = image?.variants;
  const hasVariants =
    !!variants &&
    Array.isArray(variants.webp) &&
    variants.webp.length > 0 &&
    Array.isArray(variants.avif) &&
    variants.avif.length > 0;

  const effectiveSrc: ImageProps["src"] | null = hasVariants
    ? pickLargestWebpUrl(variants)
    : (image?.url ?? image?.original ?? src ?? null);
  const effectiveBlur = blurDataURL ?? image?.blurDataURL ?? undefined;

  // Stable identity for state reset — when this changes, treat as a new image.
  const identity =
    typeof effectiveSrc === "string"
      ? effectiveSrc
      : JSON.stringify(effectiveSrc);

  const [loaded, setLoaded] = useState<boolean>(false);
  const [errored, setErrored] = useState<boolean>(false);
  const [trackedIdentity, setTrackedIdentity] = useState(identity);
  if (identity !== trackedIdentity) {
    setTrackedIdentity(identity);
    setLoaded(false);
    setErrored(false);
  }

  const hasBlur = typeof effectiveBlur === "string" && effectiveBlur.length > 0;

  // Cached-image rescue: a cached <img> can finish loading BEFORE React
  // hydrates and attaches onLoad. Without this check we'd sit at opacity-0
  // forever. Runs synchronously when React attaches the ref.
  const handleImgRef = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setErrored(true);
    }
  }, []);

  // Wrapper: in fill mode we use a fragment (caller's parent IS the
  // positioning context). In fixed mode we inject a `relative inline-block`
  // span so the overlays still resolve against the rendered image's box.
  const fixedWrapperStyle: CSSProperties | undefined = !isFill
    ? { width: intrinsicWidth, height: intrinsicHeight }
    : undefined;
  function wrap(children: React.ReactNode): React.ReactElement {
    if (isFill) return <>{children}</>;
    return (
      <span
        className="relative inline-block leading-[0]"
        style={fixedWrapperStyle}
      >
        {children}
      </span>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────────────
  if (errored || effectiveSrc == null) {
    return wrap(
      <span
        className={cn(
          "flex items-center justify-center bg-cream text-soft-gray",
          isFill ? "absolute inset-0" : "block h-full w-full",
          wrapperClassName
        )}
        aria-hidden
      >
        <ImageOff className="h-6 w-6 opacity-40" />
      </span>
    );
  }

  // ── PHASE-7 NATIVE <picture> PATH ──────────────────────────────
  if (hasVariants) {
    const avifSrcSet = srcSet(variants.avif);
    const webpSrcSet = srcSet(variants.webp);
    const fallbackSrc = effectiveSrc as string;

    // React 19 exposes this as the camelCase `fetchPriority` prop and maps it
    // to the lowercase `fetchpriority` HTML attribute itself. Passing the
    // lowercase name instead makes React reject it as an unknown DOM property
    // and drop it — so the hint never reached the browser at all.
    const eager = preload === true || loading === "eager";

    return wrap(
      <>
        {/* Blur background underlay — CSS background-image so the <picture>
            stacks on top with opacity transitions. */}
        {hasBlur && (
          <div
            aria-hidden
            className={cn(
              "bg-cover bg-center",
              isFill ? "absolute inset-0" : "absolute inset-0 h-full w-full",
              wrapperClassName
            )}
            style={{ backgroundImage: `url(${effectiveBlur})` }}
          />
        )}
        {/* Shimmer only when there's no blur to hide behind. */}
        {!hasBlur && !loaded && (
          <Shimmer
            className={cn("absolute inset-0", wrapperClassName)}
            rounded=""
          />
        )}
        <picture>
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
          {/* Intentional raw <img>: this path bypasses /_next/image to serve
              directly from the Firebase CDN. next/image can't render a
              <picture>, and the optimizer would re-encode our already-optimal
              AVIF/WebP, slowing the first paint AND blowing the cache TTL. */}
          <img
            ref={handleImgRef}
            src={fallbackSrc}
            sizes={sizes}
            alt={alt ?? ""}
            // Mutually-exclusive sizing: in fill mode the CSS classes below
            // size the <img> to its parent; intrinsic width/height ARE NOT
            // set as HTML attrs because the aspect-ratio container reserves
            // space, and setting them risks layout collisions. In fixed
            // mode the intrinsic dims become the HTML attrs AND drive
            // layout (browser uses them for the box).
            {...(isFill
              ? {}
              : {
                  width: intrinsicWidth,
                  height: intrinsicHeight,
                })}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={fetchPriority ?? (eager ? "high" : "auto")}
            className={cn(
              isFill && "absolute inset-0 h-full w-full",
              className,
              "transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={(event) => {
              setLoaded(true);
              onLoad?.(event);
            }}
            onError={(event) => {
              setErrored(true);
              onError?.(event);
            }}
          />
        </picture>
      </>
    );
  }

  // ── LEGACY / LOCAL next/image PATH ─────────────────────────────
  // next/image requires EITHER `fill` OR `width`+`height`, NEVER both.
  // We build the sizing props as a discriminated literal so the type
  // checker and runtime agree that the two are mutually exclusive.
  const nextSizingProps = isFill
    ? ({ fill: true as const } satisfies Pick<ImageProps, "fill">)
    : ({
        width: intrinsicWidth,
        height: intrinsicHeight,
      } satisfies Pick<ImageProps, "width" | "height">);

  return wrap(
    <>
      {!hasBlur && !loaded && (
        <Shimmer
          className={cn(
            isFill ? "absolute inset-0" : "absolute inset-0 h-full w-full",
            wrapperClassName
          )}
          rounded=""
        />
      )}
      <Image
        {...rest}
        src={effectiveSrc}
        alt={alt ?? ""}
        ref={handleImgRef}
        {...nextSizingProps}
        sizes={sizes}
        preload={preload}
        loading={loading}
        className={cn(
          className,
          !hasBlur && "transition-opacity duration-500",
          !hasBlur && !loaded && "opacity-0",
          !hasBlur && loaded && "opacity-100"
        )}
        {...(hasBlur
          ? { placeholder: "blur" as const, blurDataURL: effectiveBlur }
          : {})}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setErrored(true);
          onError?.(event);
        }}
      />
    </>
  );
}
