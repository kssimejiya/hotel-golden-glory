"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateRoomRatesAction } from "@/lib/admin/room-actions";
import { mealPlanLabels } from "@/lib/content";
import type { MealPlan, RoomRate } from "@/types";

const PLAN_ORDER: MealPlan[] = ["EP", "CP", "MAP"];

interface RateEditorProps {
  slug: string;
  rates: RoomRate[];
}

type RateMatrix = Record<MealPlan, { single: number; double: number }>;

function ratesToMatrix(rates: RoomRate[]): RateMatrix {
  const out = {} as RateMatrix;
  for (const plan of PLAN_ORDER) {
    const r = rates.find((x) => x.plan === plan);
    out[plan] = { single: r?.single ?? 0, double: r?.double ?? 0 };
  }
  return out;
}

function matrixToRates(m: RateMatrix): RoomRate[] {
  return PLAN_ORDER.map((plan) => ({
    plan,
    single: m[plan].single,
    double: m[plan].double,
  }));
}

function matrixEqual(a: RateMatrix, b: RateMatrix): boolean {
  return PLAN_ORDER.every(
    (p) => a[p].single === b[p].single && a[p].double === b[p].double
  );
}

export function RateEditor({ slug, rates }: RateEditorProps) {
  const initialMatrix = useMemo(() => ratesToMatrix(rates), [rates]);
  const [matrix, setMatrix] = useState<RateMatrix>(initialMatrix);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = !matrixEqual(matrix, initialMatrix);

  // Heads-up if double < single for any plan — informational only, doesn't
  // block save (per Phase 3 brief: don't assume the relationship).
  const inverted: MealPlan[] = PLAN_ORDER.filter(
    (p) => matrix[p].double < matrix[p].single
  );

  function setCell(plan: MealPlan, key: "single" | "double", raw: string) {
    setSaved(false);
    setError(null);
    const n = parseInt(raw, 10);
    setMatrix((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [key]: Number.isFinite(n) ? n : 0 },
    }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateRoomRatesAction(slug, matrixToRates(matrix));
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border-warm">
        <table className="w-full text-sm">
          <thead className="bg-cream/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-soft-gray">
                Meal plan
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-soft-gray">
                Single (₹)
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-soft-gray">
                Double (₹)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-warm">
            {PLAN_ORDER.map((plan) => (
              <tr key={plan}>
                <td className="px-3 py-2">
                  <span className="font-medium text-charcoal">
                    {mealPlanLabels[plan]?.short ?? plan}
                  </span>
                  <span className="ml-1.5 text-xs text-soft-gray">({plan})</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={99999}
                    inputMode="numeric"
                    value={matrix[plan].single}
                    onChange={(e) => setCell(plan, "single", e.target.value)}
                    aria-label={`${plan} single rate in rupees`}
                    className="w-28 rounded-md border border-border-warm bg-white px-2 py-1 text-right text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={99999}
                    inputMode="numeric"
                    value={matrix[plan].double}
                    onChange={(e) => setCell(plan, "double", e.target.value)}
                    aria-label={`${plan} double rate in rupees`}
                    className="w-28 rounded-md border border-border-warm bg-white px-2 py-1 text-right text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inverted.length > 0 && (
        <p className="text-xs text-amber-700">
          Heads up: double rate is lower than single for{" "}
          {inverted.join(", ")}. Save anyway if intentional.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Rates
        </button>
        {saved && (
          <span
            role="status"
            className="inline-flex items-center gap-1 text-xs font-medium text-green-700"
          >
            <Check className="h-3 w-3" />
            Rates updated
          </span>
        )}
        {error && (
          <span role="alert" className="text-xs text-red-600">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
