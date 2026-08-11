"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SmartImage } from "@/components/shared/SmartImage";
import { promoVideo } from "@/lib/content";
import { cn } from "@/lib/utils";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

/** Start buffering this far before the section reaches the viewport. */
const PRELOAD_MARGIN = "300px";

/** 34.783 → "0:35" */
function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * VideoShowcase — property tour with a warm start.
 *
 * Loading is staged so that pressing play feels instant without making every
 * visitor pay for the video:
 *
 *   page load     → poster only (one AVIF, fetched eagerly so the frame is
 *                   sharp by the time it is scrolled to — no blur-to-sharp pop)
 *   section near  → <video> mounts with preload="auto" and starts buffering
 *   click         → play() on already-buffered data, so playback is immediate
 *
 * The middle stage is the point. Visitors who never scroll this far download
 * no video at all; those who do get several seconds of buffering for free
 * while they read the heading, which is the gap that used to be visible as
 * "click, wait, then play".
 */
export function VideoShowcase() {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Non-null once we've committed to an encode — this is what starts the
  // download. Kept separate from `playing` so buffering can run ahead of,
  // and independently of, the user's click.
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Resolved on the client only. Doing this during render would read
  // matchMedia during SSR and break hydration; by the time the observer or a
  // click runs, we are unambiguously on the client.
  const resolveSrc = useCallback(
    () =>
      window.matchMedia("(min-width: 1024px)").matches
        ? promoVideo.sources.desktop
        : promoVideo.sources.mobile,
    []
  );

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    // No IntersectionObserver (very old browsers): skip the warm start and
    // fall back to loading on click. Playback still works, just not instantly.
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setSrc((current) => current ?? resolveSrc());
        io.disconnect(); // one-shot: we only ever need to start the download once
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [resolveSrc]);

  // Fallback path only: if someone clicks before the observer fired, the
  // <video> mounts on that click and we start it here, once it exists.
  useEffect(() => {
    if (!playing) return;
    const v = videoRef.current;
    if (v && v.paused) void v.play().catch(() => {});
  }, [playing, src]);

  function handlePlay() {
    setSrc((current) => current ?? resolveSrc());
    setPlaying(true);
    // Call play() directly in the click handler on the common path, so the
    // user activation is unambiguous. The effect above covers the rare case
    // where the element does not exist yet.
    const v = videoRef.current;
    if (v) void v.play().catch(() => {});
  }

  const duration = formatDuration(promoVideo.durationSeconds);

  return (
    <section className="bg-charcoal py-20">
      <Container>
        <motion.div
          variants={prefersReducedMotion ? undefined : sectionStaggerVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={viewportConfig}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={prefersReducedMotion ? undefined : sectionItemVariants}
            className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold"
          >
            {promoVideo.eyebrow}
          </motion.p>
          <motion.h2
            variants={prefersReducedMotion ? undefined : sectionItemVariants}
            className="mt-2 text-section-heading font-display font-semibold text-cream"
          >
            {promoVideo.heading}
          </motion.h2>
          <motion.div
            variants={prefersReducedMotion ? undefined : sectionItemVariants}
            className="mx-auto mt-4 h-0.5 w-16 bg-gold"
          />
          <motion.p
            variants={prefersReducedMotion ? undefined : sectionItemVariants}
            className="mt-6 text-base leading-relaxed text-cream/70"
          >
            {promoVideo.body}
          </motion.p>
        </motion.div>

        <Reveal className="mx-auto mt-12 max-w-5xl">
          {/* aspect-[2/1] matches the source footage and is set here, so
              revealing the video underneath cannot shift the page. */}
          <div
            ref={frameRef}
            className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
          >
            {/* Mounted as soon as the section is near, buffering underneath the
                poster. No `poster` attribute on purpose — it would pull the
                full-size original JPEG, which the <SmartImage> overlay already
                covers at the right resolution. */}
            {src !== null && (
              <video
                ref={videoRef}
                src={src}
                controls={playing}
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full bg-black"
              >
                Your browser cannot play this video.
              </video>
            )}

            {!playing && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label={`Play the property tour video, ${duration} long`}
                className="group absolute inset-0 z-10 h-full w-full cursor-pointer"
              >
                <SmartImage
                  image={promoVideo.poster}
                  alt={promoVideo.poster.alt ?? ""}
                  fill
                  quality={90}
                  // Eager: this is a large, deliberate visual well down the
                  // page. Lazy-loading it meant arriving at the section before
                  // the image did, and watching the blur placeholder resolve.
                  loading="eager"
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />

                {/* Scrim: the lit facade is bright enough that the control
                    would otherwise fight the background for contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-full bg-gold",
                      "shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out",
                      "group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    )}
                  >
                    {/* translate-x nudge optically centres the triangle — its
                        visual centre of mass sits left of its bounding box. */}
                    <Play
                      className="h-8 w-8 translate-x-0.5 fill-charcoal text-charcoal"
                      strokeWidth={1.5}
                    />
                  </span>
                </span>

                {/* Bottom-LEFT deliberately: the footage carries a burned-in
                    contact card in its bottom-right corner, and the two
                    collide there. */}
                <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 font-body text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                  {duration}
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
