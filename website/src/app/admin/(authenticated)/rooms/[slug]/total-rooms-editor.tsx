"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateTotalRoomsAction } from "@/lib/admin/room-actions";

export function TotalRoomsEditor({
  slug,
  initialValue,
}: {
  slug: string;
  initialValue: number;
}) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = value !== initialValue;

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateTotalRoomsAction(slug, value);
      if (res?.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="number"
        min={0}
        max={999}
        inputMode="numeric"
        aria-label="Total rooms in this category"
        value={value}
        onChange={(e) => {
          setSaved(false);
          setError(null);
          const n = parseInt(e.target.value, 10);
          setValue(Number.isNaN(n) ? 0 : n);
        }}
        className="w-24 rounded-lg border border-border-warm bg-white px-3 py-2 text-sm font-medium tabular-nums text-charcoal transition-colors hover:border-gold/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || pending}
        className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Save
      </button>
      {saved && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
          <Check className="h-3 w-3" />
          Saved
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
