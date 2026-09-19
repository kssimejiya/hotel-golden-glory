"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { heroSlides } from "@/lib/content";
import { useHydratedReducedMotion } from "@/lib/hooks/useHydratedReducedMotion";

// 1x1 charcoal PNG — Next/Image scales + blurs it to fill the frame while a
// photo loads, so the slider never flashes white.
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgwAYAABUAAfYBfO0AAAAASUVORK5CYII=";

/** How long each photo holds before the next one fades in. */
const SLIDE_MS = 5500;

/**
 * Full-screen photo slider — photos only, with no copy drawn over them, as
 * the hotel's final website structure asks.
 *
 * A crossfade rather than a sliding track: stacked slides swap opacity, so
 * nothing moves sideways under the transparent header. Each photo mounts the
 * first time it is current or next in line, so first paint downloads two
 * photos instead of every slide, and fading back never re-downloads.
 *
 * Autoplay pauses under the mouse, while keyboard focus is inside and while
 * the tab is hidden, and never runs for reduced-motion visitors — the arrows
 * and dots still work for them. The pause button meets WCAG 2.2.2 for content
 * that moves on its own for longer than five seconds.
 */
export function Hero() {
  const count = heroSlides.length;
  const prefersReducedMotion = useHydratedReducedMotion();
  const [index, setIndex] = useState(0);
  // The slide fading out keeps its Ken Burns zoom until it is transparent;
  // dropping the class mid-fade would snap it back to scale 1 in view.
  const [previous, setPrevious] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(
    () => new Set([0, 1 % count])
  );
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const goTo = useCallback(
    (target: number) => {
      const next = (target + count) % count;
      if (next === index) return;
      setPrevious(index);
      setIndex(next);
      setLoaded((prev) => {
        const after = (next + 1) % count;
        return prev.has(next) && prev.has(after)
          ? prev
          : new Set([...prev, next, after]);
      });
    },
    [count, index]
  );

  useEffect(() => {
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const autoplay =
    !prefersReducedMotion && !paused && !hovering && !keyboardFocus && tabVisible;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => goTo(index + 1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, goTo, index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Photos of Hotel Golden Glory"
      className="relative h-svh min-h-[28rem] w-full overflow-hidden bg-charcoal"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
      // Keyboard focus only: a mouse click also focuses the arrow it hits,
      // and that should not freeze the slideshow once the pointer leaves.
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) setKeyboardFocus(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setKeyboardFocus(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") goTo(index - 1);
        if (e.key === "ArrowRight") goTo(index + 1);
      }}
    >
      {/* Slide changes are announced only when a person caused them — an
          autoplaying region that speaks every few seconds is noise. */}
      <div aria-live={autoplay ? "off" : "polite"} className="absolute inset-0">
        {heroSlides.map((slide, i) => {
          const current = i === index;
          const zooming = !prefersReducedMotion && (current || i === previous);
          return (
            <div
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!current}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                current ? "opacity-100" : "opacity-0"
              )}
            >
              {loaded.has(i) && (
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  preload={i === 0}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className={cn("object-cover", zooming && "gallery-ken-burns")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrims carry no text: they keep the transparent header above and the
          controls below legible over bright photos. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-charcoal/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-charcoal/70 to-transparent"
      />

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous photo"
        className={arrowClass("left-3 sm:left-6")}
      >
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next photo"
        className={arrowClass("right-3 sm:right-6")}
      >
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* bottom-28 on small screens clears the fixed mobile booking bar. */}
      <div className="absolute inset-x-0 bottom-28 z-10 flex items-center justify-center gap-3 sm:bottom-10">
        {/* A phone is too narrow for a dot per photo, so it shows a count. */}
        <span className="flex h-8 items-center rounded-full border border-white/30 bg-charcoal/30 px-3 text-xs font-medium tabular-nums text-white backdrop-blur-sm sm:hidden">
          {index + 1} / {count}
        </span>
        <div className="hidden items-center sm:flex">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              className="p-1.5"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                )}
              />
            </button>
          ))}
        </div>
        {!prefersReducedMotion && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-charcoal/30 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/50"
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}

function arrowClass(position: string) {
  return cn(
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-charcoal/30 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/50 sm:h-12 sm:w-12",
    position
  );
}
