"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { promoVideo } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Start buffering this far before the player reaches the viewport.
 *
 * Deliberately short. The player sits inside the Welcome block, barely a
 * screen below the hero, so a generous margin would fire at rest for every
 * visitor — including those who bounce without scrolling. This value is tuned
 * so it does NOT trigger at scroll 0 on a typical laptop viewport, but does as
 * soon as the page moves.
 */
const PRELOAD_MARGIN = "200px";

/**
 * Whether this visitor should get the background buffer at all.
 *
 * Load-bearing rather than a nicety: much of this hotel's traffic is Indian
 * mobile data, and quietly pulling 6 MB on a capped or 2G connection is
 * exactly what Save-Data exists to prevent. Declining only costs those
 * visitors a buffering pause if they actually press play.
 */
function shouldPrebuffer(): boolean {
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!conn) return true; // Safari/Firefox: no signal, assume it's fine
  if (conn.saveData) return false;
  return !(conn.effectiveType === "2g" || conn.effectiveType === "slow-2g");
}

/**
 * Run `cb` once the page has loaded and the browser is idle.
 *
 * Without this the buffer would start while the hero image — the page's LCP
 * element — is still downloading, and a 12 MB video would win bandwidth from
 * the thing the visitor is actually looking at.
 */
function afterLoadWhenIdle(cb: () => void): () => void {
  let idleHandle: number | undefined;
  let cancelled = false;

  // `typeof` rather than `"requestIdleCallback" in window`: the DOM lib
  // already declares it, so the `in` form narrows the else branch to `never`
  // and TypeScript then rejects window.setTimeout there. Safari only shipped
  // requestIdleCallback in 16.4, so the fallback is still worth having.
  const hasIdleCallback = typeof window.requestIdleCallback === "function";

  const schedule = () => {
    if (cancelled) return;
    idleHandle = hasIdleCallback
      ? window.requestIdleCallback(cb, { timeout: 2000 })
      : window.setTimeout(cb, 200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleHandle === undefined) return;
    if (hasIdleCallback) window.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
  };
}

/** 34.783 → "0:35" */
function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

interface PromoVideoPlayerProps {
  className?: string;
}

/**
 * The property tour player, with no surrounding copy or section chrome — it
 * carries no heading of its own because it sits between the Welcome heading
 * and its description, where that heading already provides the context.
 *
 * Loading is staged so play feels instant without charging every visitor for
 * the video:
 *
 *   page load   → poster only (eager, but LOW priority so it never competes
 *                 with the hero image for bandwidth)
 *   on approach → <video> mounts with preload="auto" and buffers, but only
 *                 after window load + idle, and never on Save-Data/2G
 *   click       → play() on already-buffered data
 */
export function PromoVideoPlayer({ className }: PromoVideoPlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Non-null once we've committed to an encode — this is what starts the
  // download. Kept separate from `playing` so buffering can run ahead of, and
  // independently of, the user's click.
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // Resolved on the client only. Doing this during render would read
  // matchMedia during SSR and break hydration.
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
    if (typeof IntersectionObserver === "undefined") return;
    if (!shouldPrebuffer()) return;

    let cancelIdle: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect(); // one-shot: the download only ever needs starting once
        cancelIdle = afterLoadWhenIdle(() =>
          setSrc((current) => current ?? resolveSrc())
        );
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelIdle?.();
    };
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
    // Called directly in the click handler on the common path so the user
    // activation is unambiguous; the effect above covers the rare case where
    // the element does not exist yet.
    const v = videoRef.current;
    if (v) void v.play().catch(() => {});
  }

  const duration = formatDuration(promoVideo.durationSeconds);

  return (
    // aspect-[2/1] matches the source footage and is set here, so revealing
    // the video underneath cannot shift the page.
    <div
      ref={frameRef}
      className={cn(
        "relative aspect-[2/1] overflow-hidden rounded-2xl bg-charcoal",
        "shadow-[0_18px_50px_rgba(31,31,31,0.18)] ring-1 ring-charcoal/10",
        className
      )}
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
          className="absolute inset-0 h-full w-full bg-charcoal"
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
            // Eager so the frame is sharp on arrival rather than resolving out
            // of its blur placeholder — but explicitly LOW priority. This sits
            // barely a screen below the hero, and eager alone would make
            // SmartImage mark it high, contending with the page's LCP element.
            loading="eager"
            fetchPriority="low"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          {/* Scrim: the lit facade is bright enough that the control would
              otherwise fight the background for contrast. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full bg-gold sm:h-20 sm:w-20",
                "shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out",
                "group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              )}
            >
              {/* translate-x nudge optically centres the triangle — its visual
                  centre of mass sits left of its bounding box. */}
              <Play
                className="h-7 w-7 translate-x-0.5 fill-charcoal text-charcoal sm:h-8 sm:w-8"
                strokeWidth={1.5}
              />
            </span>
          </span>

          {/* Bottom-LEFT deliberately: the footage carries a burned-in contact
              card in its bottom-right corner, and the two collide there. */}
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 font-body text-xs font-semibold tracking-wide text-white backdrop-blur-sm sm:bottom-4 sm:left-4">
            {duration}
          </span>
        </button>
      )}
    </div>
  );
}
