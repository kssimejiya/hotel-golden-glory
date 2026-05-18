"use client";

import { useRef, useState, useTransition } from "react";
import {
  Upload,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { imageKey } from "@/lib/images/gallery";
import {
  uploadRoomImageAction,
  deleteRoomImageAction,
  setHeroImageAction,
  reorderGalleryAction,
} from "@/lib/admin/room-actions";
import type { GalleryImage } from "@/types";

export function GalleryEditor({
  slug,
  heroImage,
  gallery,
}: {
  slug: string;
  heroImage: string;
  gallery: GalleryImage[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const form = new FormData();
    form.append("file", file);
    startTransition(async () => {
      const res = await uploadRoomImageAction(slug, form);
      if (res?.error) setError(res.error);
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  function handleDelete(url: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setError(null);
    setBusyUrl(url);
    startTransition(async () => {
      const res = await deleteRoomImageAction(slug, url);
      if (res?.error) setError(res.error);
      setBusyUrl(null);
    });
  }

  function handleSetHero(url: string) {
    setError(null);
    setBusyUrl(url);
    startTransition(async () => {
      const res = await setHeroImageAction(slug, url);
      if (res?.error) setError(res.error);
      setBusyUrl(null);
    });
  }

  function move(url: string, direction: -1 | 1) {
    const idx = gallery.findIndex((g) => imageKey(g) === url);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= gallery.length) return;
    const nextKeys = gallery.map((g) => imageKey(g));
    nextKeys[idx] = imageKey(gallery[target]!);
    nextKeys[target] = url;
    setError(null);
    setBusyUrl(url);
    startTransition(async () => {
      const res = await reorderGalleryAction(slug, nextKeys);
      if (res?.error) setError(res.error);
      setBusyUrl(null);
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-warm bg-cream px-4 py-2 text-sm font-medium text-charcoal hover:border-gold hover:bg-gold/5">
          {pending && !busyUrl ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload image
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={pending}
          />
        </label>
        <p className="mt-1 text-xs text-soft-gray">
          JPG or PNG, under 8 MB. Stored in Firebase Storage. A blur
          placeholder is generated automatically.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {gallery.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-warm bg-cream/40 px-4 py-10 text-center">
          <p className="text-sm font-medium text-charcoal">No images yet</p>
          <p className="mt-1 text-xs text-soft-gray">
            Upload your first photo above — the first upload is automatically
            set as the hero image.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {gallery.map((entry, idx) => {
            const key = imageKey(entry);
            const isHero = key === heroImage;
            const isBusy = busyUrl === key;
            const hasVariants =
              !!entry.variants && entry.variants.webp.length > 0;
            return (
              <li
                key={key}
                className={`overflow-hidden rounded-lg border bg-white ${
                  isHero ? "border-gold ring-2 ring-gold/30" : "border-border-warm"
                }`}
              >
                <div className="relative aspect-[4/3] w-full bg-cream">
                  <SmartImage
                    image={entry}
                    alt={entry.alt ?? `Gallery image ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                  />
                  {isHero && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Hero
                    </span>
                  )}
                  {!hasVariants && (
                    <span
                      title="Multi-size variants missing — run npm run migrate:variants to upgrade"
                      className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
                    >
                      Legacy
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => handleSetHero(key)}
                    disabled={isHero || pending}
                    className="rounded p-1.5 text-soft-gray hover:bg-gold/10 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                    title="Set as hero"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(key, -1)}
                    disabled={idx === 0 || pending}
                    className="rounded p-1.5 text-soft-gray hover:bg-cream hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(key, 1)}
                    disabled={idx === gallery.length - 1 || pending}
                    className="rounded p-1.5 text-soft-gray hover:bg-cream hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-soft-gray">
                    {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                    <button
                      type="button"
                      onClick={() => handleDelete(key)}
                      disabled={pending}
                      className="rounded p-1.5 text-soft-gray hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
