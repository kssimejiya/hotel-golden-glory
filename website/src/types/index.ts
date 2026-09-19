export type MealPlan = "EP" | "CP" | "MAP";
export type Occupancy = "single" | "double";
/**
 * "superior" is retired — its rooms were folded into Deluxe. It stays in the
 * union so bookings made before the merge still type-check and render.
 */
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
  /**
   * Guest ticked "Honeymoon stay" — claims the Half Kg Cake Free special
   * offer. Optional so bookings made before the field existed still read.
   */
  honeymoon?: boolean;
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

/** One photo in the homepage hero slider. `alt` is for screen readers only. */
export interface HeroSlide {
  src: string;
  alt: string;
}

/** A facility featured in the homepage Facilities section. */
export interface FacilityHighlight {
  id: string;
  title: string;
  /** Short chip over the photo, e.g. "Open 24x7". */
  badge?: string;
  description: string;
  /** Omitted until a photo exists — the card shows its icon panel instead. */
  image?: string;
  /** CSS object-position for the photo's crop; defaults to centred. */
  imagePosition?: string;
  icon: string;
}

/**
 * One group in the header's four-dot amenities menu — a titled list of what
 * the hotel provides under that heading.
 */
export interface FacilityGroup {
  id: string;
  title: string;
  icon: string;
  items: string[];
}

/** One place in the homepage In & Around list. */
export interface NearbyPlace {
  name: string;
  /** The hotel's one-line note on the place, when it gave one. */
  note?: string;
  /** Distance as the hotel wrote it, e.g. "55 km"; only some places have one. */
  distance?: string;
}

/** One bullet in the events copy; "Other Special Events" nests `subItems`. */
export interface EventVenueItem {
  label: string;
  /** The text after the colon, where the hotel's copy has one. */
  detail?: string;
  subItems?: string[];
}

/**
 * The hotel's event-venue copy, shown under the amenities in the menu drawer.
 * `FacilityGroup` can't hold it — this has a paragraph and nested bullets.
 */
export interface EventVenue {
  title: string;
  intro: string;
  sections: {
    id: string;
    title: string;
    icon: string;
    items: EventVenueItem[];
  }[];
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
