import type { BookingPricing } from "@/types";
import { formatCurrency } from "@/lib/booking/pricing";

interface PriceBreakdownProps {
  pricing: BookingPricing;
  className?: string;
}

export function PriceBreakdown({ pricing, className }: PriceBreakdownProps) {
  const gstPercent = pricing.subtotal > 0
    ? Math.round((pricing.taxes / pricing.subtotal) * 100)
    : 12;

  return (
    <div className={className}>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-soft-gray">
          <span>
            {formatCurrency(pricing.baseRate)} × {pricing.nights} night
            {pricing.nights > 1 ? "s" : ""}
            {pricing.rooms > 1 ? ` × ${pricing.rooms} rooms` : ""}
          </span>
          <span>{formatCurrency(pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between text-soft-gray">
          <span>GST ({gstPercent}%)</span>
          <span>{formatCurrency(pricing.taxes)}</span>
        </div>
        <div className="border-t border-border-warm pt-2">
          <div className="flex justify-between font-semibold text-charcoal">
            <span>Total</span>
            <span className="font-display text-lg">{formatCurrency(pricing.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
