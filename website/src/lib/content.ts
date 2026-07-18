import type { Room, Testimonial, Amenity } from "@/types";

export const hotelInfo = {
  name: "Hotel Golden Glory",
  shortName: "Hotel Golden Glory",
  brand: "The Blues",
  tagline: "Your Comfort is our Glory",
  description:
    "A modern business hotel in Rajkot offering 34 thoughtfully designed rooms across 4 categories, 24/7 multi-cuisine dining, and versatile conference facilities.",
  address: {
    street: "B/h Bhutkhana Petrol Pump",
    area: "Bhutkhana Chowk, Bus Stand Road",
    city: "Rajkot",
    state: "Gujarat",
    zip: "360002",
    country: "India",
    full: "B/h Bhutkhana Petrol Pump, Bhutkhana Chowk, Bus Stand Road, Rajkot, Gujarat 360002, India",
  },
  phone: "+91 9081354542",
  phone2: "+91 9081354541",
  email: "reservations@hotelgoldenglory.com",
  checkIn: "14:00",
  checkOut: "12:00 noon",
  totalRooms: 34,
} as const;

export const mealPlanLabels: Record<string, { short: string; full: string }> = {
  EP: { short: "Room Only", full: "European Plan — Room Only" },
  CP: { short: "With Breakfast", full: "Continental Plan — Room with Breakfast" },
  MAP: { short: "Breakfast + Dinner", full: "Modified American Plan — Breakfast & Dinner" },
};

export const rooms: Room[] = [
  {
    slug: "deluxe",
    name: "Deluxe Room",
    shortName: "Deluxe",
    tagline: "Smart comfort for the savvy traveller",
    description:
      "The Deluxe Room at Golden Glory is designed for the modern business traveller who values efficiency without compromising on comfort. Warm wood tones, a plush king-size bed, and a well-lit workspace make this room the ideal base for your Rajkot trip.\n\nEach of our 13 Deluxe rooms comes equipped with high-speed Wi-Fi, a smart TV, individually controlled air conditioning, and a marble-finished bathroom. Whether you're wrapping up a late-night report or unwinding after a day of meetings, the Deluxe Room delivers everything you need — and nothing you don't.",
    sqft: 250,
    totalRooms: 13,
    hasBalcony: false,
    maxOccupancy: 2,
    bedConfiguration: "King bed",
    rates: [
      { plan: "EP", single: 2799, double: 3299 },
      { plan: "CP", single: 2999, double: 3999 },
      { plan: "MAP", single: 3499, double: 4499 },
    ],
    amenities: [
      { icon: "Wifi", label: "High-Speed Wi-Fi" },
      { icon: "Snowflake", label: "Air Conditioning" },
      { icon: "Tv", label: "Smart TV" },
      { icon: "BedDouble", label: "King-Size Bed" },
      { icon: "Bath", label: "Premium Bathroom" },
      { icon: "Coffee", label: "Tea/Coffee Maker" },
      { icon: "Phone", label: "Direct Dial Phone" },
      { icon: "Lock", label: "Electronic Safe" },
    ],
    heroImage: "/images/rooms/deluxe/hero.jpg",
    gallery: [
      { url: "/images/rooms/deluxe/hero.jpg" },
      { url: "/images/rooms/deluxe/bed-stone-headboard.jpg" },
      { url: "/images/rooms/deluxe/bed-tv-city-view.jpg" },
      { url: "/images/rooms/deluxe/tv-wall-unit.jpg" },
      { url: "/images/rooms/shared/bathroom-hero.jpg" },
    ],
    highlights: [
      "Best-value room with all essential business amenities",
      "Generously sized work desk with reading lamp",
      "Marble-finished bathroom with premium toiletries",
      "Complimentary high-speed Wi-Fi throughout stay",
      "24/7 in-room dining",
    ],
  },
  {
    slug: "superior",
    name: "Superior Room",
    shortName: "Superior",
    tagline: "Extra space, extra ease",
    description:
      "Step up to the Superior Room for a noticeably more refined experience. Every detail — from the teal-accented headboard and ambient lighting to the upgraded soft furnishings — has been chosen to make your stay feel less like a hotel room and more like a personal retreat.\n\nWith the same generous 250-square-foot layout as the Deluxe but with premium finishes and better appointments throughout, the Superior Room is our most popular category for returning guests. A full-length wardrobe, mini refreshment station, and enhanced bathroom amenities round out the offering.",
    sqft: 250,
    totalRooms: 13,
    hasBalcony: false,
    maxOccupancy: 2,
    bedConfiguration: "King bed",
    rates: [
      { plan: "EP", single: 3299, double: 3799 },
      { plan: "CP", single: 3499, double: 4499 },
      { plan: "MAP", single: 3999, double: 4999 },
    ],
    amenities: [
      { icon: "Wifi", label: "High-Speed Wi-Fi" },
      { icon: "Snowflake", label: "Air Conditioning" },
      { icon: "Tv", label: "Smart TV" },
      { icon: "BedDouble", label: "King-Size Bed" },
      { icon: "Bath", label: "Premium Bathroom" },
      { icon: "Coffee", label: "Tea/Coffee Maker" },
      { icon: "Phone", label: "Direct Dial Phone" },
      { icon: "Lock", label: "Electronic Safe" },
    ],
    heroImage: "/images/rooms/superior/hero.jpg",
    gallery: [
      { url: "/images/rooms/superior/hero.jpg" },
      { url: "/images/rooms/superior/bed-teal-headboard.jpg" },
      { url: "/images/rooms/superior/bed-teal-daylight.jpg" },
      { url: "/images/rooms/superior/entryway-wardrobe.jpg" },
      { url: "/images/rooms/shared/bathroom-tub.jpg" },
    ],
    highlights: [
      "Premium furnishings with designer teal-accent headboard",
      "Enhanced bathroom with rain shower and premium toiletries",
      "Upgraded soft linens and pillow selection",
      "Full-length wardrobe with ample storage",
      "Preferred floor allocation for quieter stays",
      "Complimentary mineral water and welcome amenities",
    ],
  },
  {
    slug: "premium",
    name: "Premium Room",
    shortName: "Premium",
    tagline: "Breathe easy with a private balcony",
    description:
      "The Premium Room brings the outdoors in with a private balcony overlooking Rajkot's cityscape. Only two of these rooms exist in the entire property, making them a genuinely exclusive choice for guests who value natural light, fresh air, and a sense of openness.\n\nInside, you'll find the same meticulous fit-out as our Superior rooms — king-size bed, marble bathroom, smart TV — enhanced with executive touches like a dedicated seating area by the window. Whether you're sipping morning chai on the balcony or reviewing tomorrow's agenda at the work desk, the Premium Room keeps productivity and relaxation in perfect balance.",
    sqft: 250,
    totalRooms: 2,
    hasBalcony: true,
    maxOccupancy: 2,
    bedConfiguration: "King bed",
    rates: [
      { plan: "EP", single: 3699, double: 4299 },
      { plan: "CP", single: 3999, double: 4999 },
      { plan: "MAP", single: 4499, double: 5499 },
    ],
    amenities: [
      { icon: "Wifi", label: "High-Speed Wi-Fi" },
      { icon: "Snowflake", label: "Air Conditioning" },
      { icon: "Tv", label: "Smart TV" },
      { icon: "BedDouble", label: "King-Size Bed" },
      { icon: "Bath", label: "Premium Bathroom" },
      { icon: "Coffee", label: "Tea/Coffee Maker" },
      { icon: "Phone", label: "Direct Dial Phone" },
      { icon: "Lock", label: "Electronic Safe" },
      { icon: "Sun", label: "Private Balcony" },
      { icon: "Mountain", label: "City View" },
    ],
    heroImage: "/images/rooms/premium/hero.jpg",
    gallery: [
      { url: "/images/rooms/premium/hero.jpg" },
      { url: "/images/rooms/premium/seating-area.jpg" },
      { url: "/images/rooms/premium/entryway-blue-wardrobe.jpg" },
      { url: "/images/rooms/premium/bed-window.jpg" },
      { url: "/images/rooms/shared/bathroom-vanity.jpg" },
    ],
    highlights: [
      "Private balcony with city views — only 2 in the hotel",
      "Dedicated seating area by floor-to-ceiling window",
      "Executive work desk with enhanced lighting",
      "Premium bathroom with separate rain shower",
      "Priority check-in and dedicated concierge",
    ],
  },
  {
    slug: "blues-suite",
    name: "Blues Suite",
    shortName: "Suite",
    tagline: "The signature experience",
    description:
      "The Blues Suite is our flagship accommodation — thoughtfully designed space that sets the benchmark for hospitality in Rajkot. A separate living area with comfortable seating, a dedicated workspace, and a private balcony with panoramic views create an environment where you can host, work, and unwind without ever feeling confined.\n\nEvery detail has been elevated: from the premium bed linens and pillow menu to the marble bathroom with luxury toiletries, the Blues Suite delivers an experience that justifies its name. Six suites are available, each positioned on upper floors for maximum privacy and the best views in the house.",
    sqft: 320,
    totalRooms: 6,
    hasBalcony: true,
    maxOccupancy: 3,
    bedConfiguration: "King bed + sofa",
    rates: [
      { plan: "EP", single: 5199, double: 5799 },
      { plan: "CP", single: 5799, double: 6399 },
      { plan: "MAP", single: 6399, double: 6999 },
    ],
    amenities: [
      { icon: "Wifi", label: "High-Speed Wi-Fi" },
      { icon: "Snowflake", label: "Air Conditioning" },
      { icon: "Tv", label: "Smart TV" },
      { icon: "BedDouble", label: "King-Size Bed" },
      { icon: "Bath", label: "Premium Bathroom" },
      { icon: "Coffee", label: "Tea/Coffee Maker" },
      { icon: "Phone", label: "Direct Dial Phone" },
      { icon: "Lock", label: "Electronic Safe" },
      { icon: "Sun", label: "Private Balcony" },
      { icon: "Briefcase", label: "Dedicated Workspace" },
      { icon: "Mountain", label: "City View" },
      { icon: "Sparkles", label: "Premium Toiletries" },
    ],
    heroImage: "/images/rooms/blues-suite/hero.jpg",
    gallery: [
      { url: "/images/rooms/blues-suite/hero.jpg" },
      { url: "/images/rooms/blues-suite/full-balcony-view.jpg" },
      { url: "/images/rooms/blues-suite/bed-detail.jpg" },
      { url: "/images/rooms/blues-suite/room-wide.jpg" },
      { url: "/images/rooms/shared/bathroom-hero.jpg" },
    ],
    highlights: [
      "Largest rooms with separate living area",
      "Private balcony with panoramic city views",
      "Dedicated workspace ideal for extended business stays",
      "Premium king bed with luxury linens and pillow menu",
      "Upper-floor positioning for maximum privacy",
      "Complimentary welcome amenities and mineral water",
    ],
  },
];

export const roomFAQs = [
  {
    question: "What's included in each meal plan?",
    answer:
      "Room Only (EP) includes accommodation with no meals. With Breakfast (CP) adds a daily breakfast buffet. Breakfast + Dinner (MAP) includes both daily breakfast and dinner buffets. All plans include complimentary Wi-Fi, parking, and access to hotel facilities.",
  },
  {
    question: "What's the cancellation policy?",
    // PLACEHOLDER — replace with actual hotel cancellation policy
    answer:
      "Free cancellation up to 24 hours before check-in. Cancellations within 24 hours of check-in or no-shows will be charged one night's room rate. Group bookings (5+ rooms) may have different terms — please contact reservations for details.",
  },
  {
    question: "Are there any extra charges?",
    answer:
      "Applicable taxes (GST) will be added to the room rate. Extra bed/mattress charges apply where available. Room service, laundry, and minibar items are charged separately. There are no hidden fees for Wi-Fi, parking, or use of the business centre.",
  },
  {
    question: "Can I request early check-in or late check-out?",
    answer:
      "Early check-in (before 14:00) and late check-out (after 12:00 noon) are subject to availability. Early check-in before 08:00 or late check-out after 18:00 may attract an additional charge. Please contact the front desk or reservations in advance to arrange.",
  },
  {
    question: "Is the rate per room or per person?",
    answer:
      "Single occupancy rates are for one guest per room. Double occupancy rates are for two guests sharing a room. The Blues Suite can accommodate up to 3 guests (extra mattress on request, charges apply). Children under 5 stay free when sharing the existing bedding.",
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}

export function getOtherRooms(currentSlug: string): Room[] {
  return rooms.filter((r) => r.slug !== currentSlug);
}

export const amenities: Amenity[] = [
  {
    title: "Multi-Cuisine Dining",
    description: "Multi-cuisine restaurant serving global flavours around the clock",
    icon: "UtensilsCrossed",
  },
  {
    title: "High-Speed Wi-Fi",
    description: "Complimentary high-speed internet across the property",
    icon: "Wifi",
  },
  {
    title: "Conference Facilities",
    description: "Hall and meeting room for up to 100 guests",
    icon: "Presentation",
  },
  {
    title: "Power Backup",
    description: "Uninterrupted power supply with full generator backup",
    icon: "Zap",
  },
  {
    title: "24/7 Reception",
    description: "Round-the-clock front desk and concierge assistance",
    icon: "Clock",
  },
  {
    title: "Secure Parking",
    description: "Complimentary on-site parking for all guests",
    icon: "Car",
  },
  {
    title: "Travel Desk",
    description: "Local sightseeing, airport transfers, and car rental",
    icon: "Map",
  },
  {
    title: "Air Conditioning",
    description: "Individually controlled climate in every room",
    icon: "Snowflake",
  },
  {
    title: "Airport Pick-up & Drop",
    description: "Complimentary airport transfer service for all guests",
    icon: "Plane",
  },
  {
    title: "Driver Room",
    description: "Comfortable accommodation available for your driver",
    icon: "BedSingle",
  },
];

// PLACEHOLDER — replace with real reviews
export const testimonials: Testimonial[] = [
  {
    name: "Rajesh Mehta",
    role: "Business Consultant",
    location: "Ahmedabad",
    text: "Stayed here for a week-long project in Rajkot. The rooms are spotless, Wi-Fi never dropped during my video calls, and the restaurant kept me going with excellent food at all hours. Best value business hotel in the city.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Regional Sales Manager",
    location: "Mumbai",
    text: "We hosted a two-day sales conference at Golden Glory. The conference hall had everything we needed — projector, sound system, good lighting. The staff went out of their way to accommodate last-minute changes. Will book again.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Chartered Accountant",
    location: "Rajkot",
    text: "I recommend Golden Glory to all my clients visiting Rajkot. The location near Bhakti Nagar is convenient, the Blues Suite is genuinely impressive for the price, and the service is consistently reliable. A gem in Rajkot's hospitality scene.",
    rating: 5,
  },
];

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Contact", href: "/contact" },
] as const;
