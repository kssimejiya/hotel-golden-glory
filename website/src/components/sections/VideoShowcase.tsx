"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SmartImage } from "@/components/shared/SmartImage";
import { promoVideo } from "@/lib/content";
import {
  sectionStaggerVariants,
  sectionItemVariants,
  viewportConfig,
} from "@/lib/animations";

/** 34.783 → "0:35" */
function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * VideoShowcase — click-to-play property tour.
 *
 * Nothing but the poster loads until the visitor presses play, so the ~90% of
 * visitors who never click pay one optimized image instead of 6-12 MB of video.
 *
 * On a dark section deliberately: it separates the cream Rooms block above from
 * the white Amenities block below, and a dark surround is what makes footage
 * read as footage rather than as another photo card.
 */
export function VideoShowcase() {
  // `null` is the idle state; setting a URL both starts playback and records
  // which encode we chose. One piece of state, no possible disagreement
  // between "is playing" and "what is playing".
  const [src, setSrc] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  function play() {
    // Resolved HERE rather than during render on purpose. Reading matchMedia
    // while rendering would differ between server and client and blow up
    // hydration; inside a click handler the client is the only thing running.
    // Playback is click-initiated, so this is also the latest possible moment
    // we can decide — the viewport can no longer change under us.
    const wantsDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    setSrc(wantsDesktop ? promoVideo.sources.desktop : promoVideo.sources.mobile);
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
          {/* aspect-[2/1] matches the source footage and is set on the wrapper,
              so swapping poster → video cannot shift the page. */}
          <div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            {src === null ? (
              <button
                type="button"
                onClick={play}
                aria-label={`Play the property tour video, ${duration} long`}
                className="group absolute inset-0 h-full w-full cursor-pointer"
              >
                <SmartImage
                  image={promoVideo.poster}
                  alt={promoVideo.poster.alt ?? ""}
                  fill
                  quality={90}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />

                {/* Scrim: the facade is bright enough that a white-on-gold
                    control would otherwise fight the background for contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                    {/* translate-x nudge optically centres the triangle inside
                        the circle — its visual centre of mass sits left of its
                        bounding box. */}
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
            ) : (
              <video
                src={src}
                poster={promoVideo.poster.original}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full bg-black"
              >
                Your browser cannot play this video.
              </video>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
