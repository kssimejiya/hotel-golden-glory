export type MealPlan = "EP" | "CP" | "MAP";
export type Occupancy = "single" | "double";
export type RoomSlug = "deluxe" | "superior" | "premium" | "blues-suite";
export type BookingStatus = "draft" | "awaiting_payment" | "confirmed" | "cancelled" | "failed";

export interface RoomRate {
  plan: MealPlan;
  single: number;
  double: number;
}

export interface RoomAmenity {
  icon: string;
  label: string;
}

/**
 * Image variant — one rendition of an image at a specific width.
 * Both width and height are intrinsic pixel dimensions of THIS variant.
 */
export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

/**
 * Gallery image — supports THREE on-disk shapes, in precedence order:
 *
 *   1. Phase-7 "premium" (preferred): `original` + `variants.avif[]` +
 *      `variants.webp[]`. SmartImage renders a native <picture> straight
 *      from Firebase CDN, bypassing the Next image optimizer.
 *
 *   2. Phase-5 "legacy with blur": `url` (single optimized URL) +
 *      `blurDataURL` + `width`/`height`. SmartImage renders via next/image
 *      using the optimizer.
 *
 *   3. Pre-Phase-5 "bare string" (normalised on read by roomRepo): just `url`.
 *      Same render path as (2), but without blur — shimmer fallback applies.
 *
 * The migration tolerates all three. Renderers never assume one shape:
 * `variants?.webp?.length > 0` is the only signal for the premium path.
 *
 * Identity: `original ?? url` is the stable identity key (see imageKey()
 * helper in roomRepo). heroImage matches against this key.
 */
export interface GalleryImage {
  /** Phase-7+: untouched original, archived under {imageId}/original.{ext}. */
  original?: string;
  /** Phase-5 single optimized URL. Also the legacy identity key. */
  url?: string;
  /** Tiny base64 jpeg blur (~1-2 KB), used as placeholder. */
  blurDataURL?: string;
  /** Intrinsic width of the largest variant (or the legacy url). */
  width?: number;
  /** Intrinsic height matching width. */
  height?: number;
  alt?: string;
  /** Phase-7 multi-size renditions; absence triggers the legacy render path. */
  variants?: {
    avif: ImageVariant[];
    webp: ImageVariant[];
  };
}

export interface Room {
  slug: RoomSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  sqft: number;
  totalRooms: number;
  hasBalcony: boolean;
  maxOccupancy: number;
  bedConfiguration: string;
  rates: RoomRate[];
  amenities: RoomAmenity[];
  /** URL of the hero image. Look up the matching gallery entry for blur data. */
  heroImage: string;
  gallery: GalleryImage[];
  highlights: string[];
}

export interface BookingDates {
  checkIn: string;
  checkOut: string;
  nights: number;
}

export interface BookingGuests {
  adults: number;
  children: number;
  rooms: number;
}

export interface BookingPricing {
  baseRate: number;
  nights: number;
  rooms: number;
  subtotal: number;
  taxes: number;
  total: number;
}

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  gstin?: string;
  arrivalTime?: string;
}

export interface NewBooking {
  roomSlug: RoomSlug;
  mealPlan: MealPlan;
  occupancy: Occupancy;
  dates: BookingDates;
  guests: BookingGuests;
  pricing: BookingPricing;
  guest: GuestDetails;
}

export interface Booking extends NewBooking {
  bookingId: string;
  status: BookingStatus;
  createdAt: string;
  paymentId?: string;
  paymentOrderId?: string;
  cancellationPolicy: string;
}

export interface Testimonial {
  name: string;
  role: string;
  location: string;
  text: string;
  rating: number;
}

export interface Amenity {
  title: string;
  description: string;
  icon: string;
}

export interface BanquetInquiry {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  configuration: string;
  message: string;
}
