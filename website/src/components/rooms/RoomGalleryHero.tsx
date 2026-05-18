"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/shared/SmartImage";
import { imageKey } from "@/lib/images/gallery";
import { cardLiftTransition, tapFeedback } from "@/lib/animations";
import type { GalleryImage } from "@/types";

interface RoomGalleryHeroProps {
  images: GalleryImage[];
  roomName: string;
}

/**
 * Premium gallery — iOS-detail-view feel.
 *
 * Layered cross-fade: the previous image stays painted (`prev`) until the
 * new one (`current`) finishes loading + finishes its 400ms opacity fade.
 * Combined with the SmartImage blur underlay, this means no blank frame
 * even on slow networks for an uncached new image.
 *
 * Ken Burns: a very slow (12s, 4.5%) scale runs while the user lingers.
 * Restarts per selection via the `key={key}` on the wrapper.
 *
 * Tap echo: clicking a thumb briefly dips the main panel scale to 0.99.
 *
 * Thumbs: existing cardLift + tapFeedback from animations.ts (no new
 * Framer pattern), refined gold ring on active.
 *
 * Reduced motion: every animation has a CSS-level no-op via
 * `prefers-reduced-motion: reduce` in globals.css.
 */
export function RoomGalleryHero({ images, roomName }: RoomGalleryHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prev, setPrev] = useState<GalleryImage | null>(null);
  // Token bumped per click so we can re-trigger the tap-echo CSS animation
  // even when clicking the same thumbnail (rare but ensures responsiveness).
  const [tapToken, setTapToken] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const fadeTimer = useRef<number | null>(null);

  const active = images[activeIndex];

  // After the incoming image's fade-in completes (matches CSS 400ms), clear
  // the prev so it doesn't sit invisibly in the DOM forever. If the user
  // clicks a new thumb mid-fade, we cancel and re-schedule.
  useEffect(() => {
    if (!prev) return;
    if (fadeTimer.current !== null) {
      window.clearTimeout(fadeTimer.current);
    }
    fadeTimer.current = window.setTimeout(() => {
      setPrev(null);
      fadeTimer.current = null;
    }, 420);
    return () => {
      if (fadeTimer.current !== null) {
        window.clearTimeout(fadeTimer.current);
        fadeTimer.current = null;
      }
    };
  }, [prev]);

  if (!active) return null;
  const activeKey = imageKey(active);

  function selectThumb(i: number) {
    if (i === activeIndex) {
      // Same thumb — just fire the tap-echo for tactile feedback.
      setTapToken((t) => t + 1);
      return;
    }
    setPrev(images[activeIndex] ?? null);
    setActiveIndex(i);
    setTapToken((t) => t + 1);
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[3fr_2fr]">
      {/* Main panel — wrapper drives the tap echo + holds both prev/current
          stacked. Aspect ratio comes from the outer wrapper so swaps don't
          shift layout. */}
      {/* Hero image aspect ratio is responsive: on mobile/tablet a shorter
          16:10 keeps the standalone image from dominating the above-the-fold
          area (a tall 4:3 with no surrounding card frame reads as "zoomed"
          because nothing competes for attention in the same viewport). On
          lg+, the gallery becomes a 3fr|2fr grid where the image needs the
          4:3 ratio to feel proportionate against the 2x2 thumbnail column. */}
      <div
        key={`tap-${tapToken}`}
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-2xl bg-cream lg:aspect-[4/3]",
          !prefersReducedMotion && tapToken > 0 && "gallery-tap-echo"
        )}
      >
        {/* Outgoing image — painted underneath the incoming one until its
            fade finishes. Doesn't get Ken Burns to avoid double-motion
            during the swap. */}
        {prev && (
          <div
            key={`prev-${imageKey(prev)}`}
            className="absolute inset-0"
            aria-hidden
          >
            <SmartImage
              image={prev}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        )}

        {/* Incoming image — its own wrapper gets the Ken Burns AND the
            fade-in class. Keyed on activeKey so each new selection remounts
            fresh: SmartImage re-stages its blur, the fade-in animation
            re-runs from 0, and Ken Burns restarts at scale(1). */}
        <div
          key={`current-${activeKey}`}
          className={cn(
            "absolute inset-0",
            !prefersReducedMotion && "gallery-fade-in gallery-ken-burns"
          )}
        >
          <SmartImage
            image={active}
            alt={`${roomName} — view ${activeIndex + 1}`}
            fill
            preload={activeIndex === 0}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        {/* Subtle inner-shadow vignette — adds depth without weight. Only
            applied at lg+ where the gallery is the focal element. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden rounded-2xl lg:block"
          style={{
            boxShadow: "inset 0 0 60px rgba(31, 31, 31, 0.08)",
          }}
        />
      </div>

      {/* Thumbnails — horizontal scroll strip at standard Container padding
          on mobile/tablet (aligned with the hero image and rate card for a
          consistent vertical axis), 2x2 grid on lg+.

          Previous version used `-mx-4 sm:-mx-6` to extend the strip edge-to-
          edge — that broke visual rhythm because the hero image and rate
          card stayed at Container padding while only the thumbnails went
          full-bleed. The reason for the edge-to-edge trick was to give the
          active thumb's outer gold ring room before being clipped; switching
          to `ring-inset` (the ring sits *inside* the box) removes that need
          entirely and lets every element line up at the same gutter. */}
      <div
        className={cn(
          "flex gap-3 overflow-x-auto py-2",
          "snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-3 lg:self-start",
          "lg:overflow-visible lg:py-0 lg:snap-none"
        )}
      >
        {images.slice(0, 4).map((img, i) => {
          const key = imageKey(img);
          const isActive = activeIndex === i;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => selectThumb(i)}
              // No `whileHover={cardLift}` on the thumbnails. On iOS Safari
              // and some Android browsers, tap fires a synthetic mouseenter
              // but no corresponding mouseleave, so framer-motion's hover
              // state sticks and the thumbnail stays lifted ~6px until the
              // user taps elsewhere. The active-ring + opacity transition is
              // already sufficient selection feedback for a control whose
              // job is to be tapped in place (not navigated away from). Lift
              // is right for navigational cards; wrong for selection controls.
              whileTap={prefersReducedMotion ? undefined : tapFeedback}
              transition={cardLiftTransition}
              className={cn(
                "relative flex-shrink-0 snap-start overflow-hidden rounded-xl bg-cream transition-all duration-200",
                "aspect-[4/3] w-28 sm:w-36 lg:w-full",
                // ring-inset sits inside the element box — no clipping at
                // scroll-container edges, so the strip can use standard
                // Container padding without a fragile `-mx-*` hack.
                isActive
                  ? "ring-2 ring-inset ring-gold opacity-100"
                  : "opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1} of ${roomName}`}
              aria-pressed={isActive}
            >
              <SmartImage
                image={img}
                alt={`${roomName} — thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 120px, 20vw"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
