import type {
  Room,
  Testimonial,
  GalleryImage,
  FacilityGroup,
  FacilityHighlight,
  HeroSlide,
  NearbyPlace,
  EventVenue,
} from "@/types";

export const hotelInfo = {
  name: "Hotel Golden Glory",
  shortName: "Hotel Golden Glory",
  brand: "The Blues",
  tagline: "Your Comfort is our Glory",
  description:
    "A contemporary 4-star luxury hotel on Canal Road, Rajkot, with 34 well-appointed rooms across 3 categories, a rooftop multi-cuisine restaurant open 24x7, a board room, and a seamless blend of business and leisure.",
  address: {
    street: "Kanta Stri Vikas Grah Road, Near Bhutkhana Chowk, Canal Road",
    area: "Millpara, Bhakti Nagar",
    city: "Rajkot",
    state: "Gujarat",
    zip: "360002",
    country: "India",
    // Written exactly as the hotel sent it; the footer shows this line as-is.
    full: "Kanta Stri Vikas Grah Road, Near Bhutkhana Chowk, Canal Road, Millpara, Bhakti Nagar, Rajkot - 360002 (Gujarat)",
  },
  // 9081354541 is the number the final structure puts in the footer, so it
  // leads everywhere; 9081354542 stays as the second line.
  phone: "+91 9081354541",
  phone2: "+91 9081354542",
  email: "reservations@hotelgoldenglory.com",
  checkIn: "14:00",
  checkOut: "11:00 AM",
  totalRooms: 34,
} as const;

export const mealPlanLabels: Record<string, { short: string; full: string }> = {
  EP: { short: "Room Only", full: "European Plan — Room Only" },
  CP: { short: "With Breakfast", full: "Continental Plan — Room with Breakfast" },
  MAP: { short: "Breakfast + Dinner", full: "Modified American Plan — Breakfast & Dinner" },
};

/**
 * Room categories as the hotel's final website structure defines them:
 * Deluxe, Deluxe Premium and Suite. Superior was folded into Deluxe (now 26 rooms),
 * so the three still add up to the building's 34.
 *
 * Rates: each category's Room Only, single-occupancy price is the one the
 * final structure gives (₹3000 / ₹3500 / ₹4500). Every other plan and the
 * double rate keep the gap above that base they had before. Rates saved in
 * the admin panel (Firestore) override these.
 */
export const rooms: Room[] = [
  {
    slug: "deluxe",
    name: "Deluxe Room",
    shortName: "Deluxe",
    tagline: "Smart comfort for the savvy traveller",
    description:
      "The Deluxe Room at Golden Glory is designed for the modern business traveller who values efficiency without compromising on comfort. Warm wood tones, a plush king-size bed, and a well-lit workspace make this room the ideal base for your Rajkot trip.\n\nEach of our 26 Deluxe rooms comes equipped with high-speed Wi-Fi, a smart TV, individually controlled air conditioning, and a marble-finished bathroom. Whether you're wrapping up a late-night report or unwinding after a day of meetings, the Deluxe Room delivers everything you need — and nothing you don't.",
    sqft: 250,
    totalRooms: 26,
    hasBalcony: false,
    maxOccupancy: 2,
    bedConfiguration: "King bed",
    rates: [
      { plan: "EP", single: 3000, double: 3500 },
      { plan: "CP", single: 3200, double: 4200 },
      { plan: "MAP", single: 3700, double: 4700 },
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
    // Superior's rooms are Deluxe now, and the photo the brief captions
    // "Deluxe Room" is the former Superior hero — so it leads. The teal-
    // headboard Superior shots stay out: the brief captions that room Premium.
    heroImage: "/images/rooms/superior/hero.jpg",
    gallery: [
      { url: "/images/rooms/superior/hero.jpg" },
      { url: "/images/rooms/deluxe/hero.jpg" },
      { url: "/images/rooms/superior/entryway-wardrobe.jpg" },
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
    slug: "premium",
    name: "Deluxe Premium Room",
    shortName: "Deluxe Premium",
    tagline: "Breathe easy with a private balcony",
    description:
      "The Deluxe Premium Room brings the outdoors in with a private balcony overlooking Rajkot's cityscape. Only two of these rooms exist in the entire property, making them a genuinely exclusive choice for guests who value natural light, fresh air, and a sense of openness.\n\nInside, you'll find the same meticulous fit-out as our Deluxe rooms — king-size bed, marble bathroom, smart TV — enhanced with executive touches like a dedicated seating area by the window. Whether you're sipping morning chai on the balcony or reviewing tomorrow's agenda at the work desk, the Deluxe Premium Room keeps productivity and relaxation in perfect balance.",
    sqft: 250,
    totalRooms: 2,
    hasBalcony: true,
    maxOccupancy: 2,
    bedConfiguration: "King bed",
    rates: [
      { plan: "EP", single: 3500, double: 4100 },
      { plan: "CP", single: 3800, double: 4800 },
      { plan: "MAP", single: 4300, double: 5300 },
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
    // Photos follow the hotel's own brief captions: the teal-headboard room is
    // Deluxe Premium (the brief says "Premium Room"). Live photos are admin-panel data (Firestore); this is only the
    // fallback when that document is missing.
    heroImage: "/images/rooms/superior/bed-teal-daylight.jpg",
    gallery: [
      { url: "/images/rooms/superior/bed-teal-daylight.jpg" },
      { url: "/images/rooms/superior/bed-teal-headboard.jpg" },
      { url: "/images/rooms/premium/entryway-blue-wardrobe.jpg" },
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
    name: "Suite Room",
    shortName: "Suite",
    tagline: "The signature experience",
    description:
      "The Suite Room is our flagship accommodation — thoughtfully designed space that sets the benchmark for hospitality in Rajkot. A separate living area with comfortable seating, a dedicated workspace, and a private balcony with panoramic views create an environment where you can host, work, and unwind without ever feeling confined.\n\nEvery detail has been elevated: from the premium bed linens and pillow menu to the marble bathroom with luxury toiletries, the Suite Room delivers our most refined experience. Six suites are available, each positioned on upper floors for maximum privacy and the best views in the house.",
    sqft: 320,
    totalRooms: 6,
    hasBalcony: true,
    maxOccupancy: 3,
    bedConfiguration: "King bed + sofa",
    rates: [
      { plan: "EP", single: 4500, double: 5100 },
      { plan: "CP", single: 5100, double: 5700 },
      { plan: "MAP", single: 5700, double: 6300 },
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
    // Photos follow the hotel's own brief captions: the stone-wall room with the
    // TV panel is the Suite. The marble-panel room is left out until the hotel
    // confirms its category. Live photos are admin-panel data (Firestore).
    heroImage: "/images/rooms/deluxe/bed-tv-city-view.jpg",
    gallery: [
      { url: "/images/rooms/deluxe/bed-tv-city-view.jpg" },
      { url: "/images/rooms/deluxe/bed-stone-headboard.jpg" },
      { url: "/images/rooms/premium/hero.jpg" },
      { url: "/images/rooms/premium/bed-window.jpg" },
      { url: "/images/rooms/deluxe/tv-wall-unit.jpg" },
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
      "Applicable taxes (GST) will be added to the room rate. Extra bed/mattress charges apply where available. Room service, laundry, and minibar items are charged separately. There are no hidden fees for Wi-Fi or parking.",
  },
  {
    question: "Can I request early check-in or late check-out?",
    answer:
      "Early check-in (before 14:00) and late check-out (after 11:00 AM) are subject to availability. Early check-in before 08:00 or late check-out after 18:00 may attract an additional charge. Please contact the front desk or reservations in advance to arrange.",
  },
  {
    question: "Is the rate per room or per person?",
    answer:
      "Single occupancy rates are for one guest per room. Double occupancy rates are for two guests sharing a room. The Suite Room can accommodate up to 3 guests (extra mattress on request, charges apply). Children under 5 stay free when sharing the existing bedding.",
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}

export function getOtherRooms(currentSlug: string): Room[] {
  return rooms.filter((r) => r.slug !== currentSlug);
}

/**
 * Everything the hotel provides, for the header's four-dot (::) amenities
 * menu. The complimentary, in-room and breakfast lists are verbatim from the
 * hotel's content brief; the first group adds the two facilities the final
 * website structure names.
 */
export const facilityGroups: FacilityGroup[] = [
  {
    id: "hotel",
    title: "Hotel",
    icon: "Building2",
    items: ["Rooftop Multi-Cuisine Restaurant — Open 24x7", "Board Room"],
  },
  {
    id: "complimentary",
    title: "Complimentary Facilities",
    icon: "ConciergeBell",
    items: [
      "Parking & Valet Parking",
      "Left Luggage Facility",
      "Newspaper",
      "24 Hrs Front Desk",
      "Free Wi-Fi",
      "Driver Room",
      "Wake-up Call",
    ],
  },
  {
    id: "in-room",
    title: "In-Room Facilities",
    icon: "BedDouble",
    items: [
      "AC / Heater / Fan",
      "Electronic In-Room Safe",
      "Iron & Ironing Board",
      "1 Ltr Mineral Water",
      "Tea/Coffee Maker with Kettle",
      "Slippers",
      "Bathrobe",
      "Hair Dryer",
      "Running Hot & Cold Water",
      "Bathroom Toiletries (Soap, Body Wash, Shampoo, Body Lotion, Moisturizer, Shower Cap)",
      "Dental Kit",
      "Shaving Kit",
      "Comb",
      "Shoe Shiner",
      // Added by the hotel after the brief (2026-09-15): chargeable, and only
      // in the two upper categories.
      "Mini Bar in Suite & Deluxe Premium Rooms at Extra Charge",
    ],
  },
  {
    id: "breakfast-buffet",
    title: "Food & Beverage — Breakfast Buffet",
    icon: "Croissant",
    items: [
      "Cereals",
      "Cut & Whole Fruits",
      "Juice",
      "Breads (Whole Wheat & White)",
      "Croissant",
      "Muffins",
      "Danish",
      "Butter & Jam Marmalade",
      "Plain & Flavoured Curd",
      "Hot & Cold Milk",
      "Continental & Indian Dishes",
      "Baked Beans & Hash Brown Potato",
      "Hot Beverage Tea & Coffee",
      "Dessert",
      "Papad Pickle Chutney with Meals",
      "Ice Cube in Room on Request",
    ],
  },
];

/**
 * The hotel's event-venue copy (2026-09-16), word for word as it sent it —
 * including "(Pax)" and "50-cover restaurant". Shown under the amenities in
 * the menu drawer.
 */
export const eventVenue: EventVenue = {
  title: "Celebrate Your Special Moments with Us!",
  intro:
    "Looking for the perfect venue for your next gathering? Our elegant 50-cover restaurant is the ideal space for hosting intimate celebrations, family milestones, and social gatherings for up to 50 guests (Pax). With a warm ambiance, delectable catering, and personalized service, we turn your small events into grand memories.",
  sections: [
    {
      id: "venue-highlights",
      title: "Venue Highlights",
      icon: "Sparkles",
      items: [
        {
          label: "Seating Capacity",
          detail: "Comfortably accommodates up to 50 guests.",
        },
        {
          label: "Ambiance",
          detail:
            "Cozy, modern, and versatile setup tailored to your event's theme.",
        },
        {
          label: "Catering",
          detail:
            "Customized multi-cuisine menus (Buffet or A-la-carte options available).",
        },
      ],
    },
    {
      id: "event-types",
      title: "Perfect for All Kinds of Intimate Events",
      icon: "PartyPopper",
      items: [
        {
          label: "Intimate Weddings & Pre-Wedding Functions",
          detail:
            "Ideal for close-knit weddings, Roka ceremonies, engagements, Haldi, or Mehendi functions with your nearest and dearest.",
        },
        {
          label: "Birthday Parties",
          detail:
            "Celebrate milestone birthdays or kids' theme parties with customized decor and dedicated food counters.",
        },
        {
          label: "Anniversary Celebrations",
          detail:
            "Recreate the magic of your special day with an elegant setup, romantic lighting, and fine dining.",
        },
        {
          label: "Kitty Parties",
          detail:
            "The ultimate spot for your next social meetup. Enjoy privacy, great music, and a special High-Tea or lunch menu.",
        },
        {
          label: "Other Special Events",
          subItems: [
            "Baby Showers & Gender Reveals",
            "Family Get-togethers & Reunions",
            "Retirement Parties",
            "Corporate Meetings & Business Lunches",
          ],
        },
      ],
    },
  ],
};

/** The running promotion, rendered as the closing band on the homepage. */
export const specialOffer = {
  eyebrow: "Special Offer",
  title: "Half Kg Cake Free for Honeymoon Package",
  cta: { label: "Book Now", href: "/booking?offer=honeymoon" },
} as const;

/**
 * The full-screen homepage slider, led by the photos the final website
 * structure lists: building at night, Deluxe Premium, Suite, Deluxe, rooftop
 * restaurant — then the rest of the property. The three room slides use the
 * photos the hotel's brief captions for those categories. Nothing is drawn
 * over them; `alt` is for screen readers.
 */
export const heroSlides: HeroSlide[] = [
  { src: "/images/exterior/building-night.jpg", alt: "Hotel Golden Glory lit up at night" },
  { src: "/images/rooms/superior/bed-teal-daylight.jpg", alt: "Deluxe Premium Room with a teal headboard and sunlit window" },
  { src: "/images/rooms/deluxe/bed-tv-city-view.jpg", alt: "Suite Room with a backlit stone wall and city view" },
  { src: "/images/rooms/superior/hero.jpg", alt: "Deluxe Room with a glass-walled bathroom" },
  { src: "/images/dining/restaurant-main.jpg", alt: "Rooftop multi-cuisine restaurant" },
  { src: "/images/exterior/signage-night.jpg", alt: "The Blues Hotel Golden Glory sign lit up at night" },
  { src: "/images/lobby/main-lounge.jpg", alt: "Lobby with chandeliers and lounge seating" },
  { src: "/images/rooms/premium/hero.jpg", alt: "Guest room with a TV wall and balcony" },
  { src: "/images/rooms/shared/bathroom-tub.jpg", alt: "Bathtub with a rain shower and backlit oval mirror" },
  { src: "/images/rooms/deluxe/hero.jpg", alt: "King bed with swan towel art" },
  { src: "/images/dining/restaurant-wide.jpg", alt: "Restaurant dining hall and buffet" },
  { src: "/images/reception/front-desk.jpg", alt: "The 24-hour front desk" },
  { src: "/images/rooms/blues-suite/hero.jpg", alt: "Room with a marble feature wall and window seating" },
  { src: "/images/rooms/premium/bed-window.jpg", alt: "Two armchairs and a tea table by the window" },
  { src: "/images/rooms/deluxe/bed-stone-headboard.jpg", alt: "King bed against a backlit stone wall" },
  { src: "/images/dining/restaurant-chandeliers.jpg", alt: "Restaurant tables beneath gold chandeliers" },
  { src: "/images/rooms/shared/bathroom-hero.jpg", alt: "Marble guest bathroom" },
  { src: "/images/rooms/superior/entryway-wardrobe.jpg", alt: "Room entryway with a wardrobe and glass-walled bathroom" },
  { src: "/images/rooms/deluxe/bed-tv-wall.jpg", alt: "Guest room with a wall-mounted TV and balcony doors" },
  { src: "/images/rooms/blues-suite/room-wide.jpg", alt: "Lounge with sofas beneath a crystal chandelier" },
  { src: "/images/rooms/superior/bed-teal-headboard.jpg", alt: "King bed against a teal headboard" },
  { src: "/images/rooms/deluxe/tv-wall-unit.jpg", alt: "Backlit TV wall with a tea and coffee tray" },
  { src: "/images/rooms/blues-suite/bed-detail.jpg", alt: "Restaurant buffet counter" },
  { src: "/images/rooms/shared/bathroom-vanity.jpg", alt: "Wash basin beneath a backlit oval mirror" },
  { src: "/images/rooms/blues-suite/full-balcony-view.jpg", alt: "Guest room opening onto a balcony" },
  { src: "/images/exterior/building-night-front.jpg", alt: "Front of Hotel Golden Glory at night" },
  { src: "/images/rooms/premium/entryway-blue-wardrobe.jpg", alt: "Room entryway with a navy wardrobe and frosted glass door" },
  { src: "/images/rooms/shared/bathroom-beige.jpg", alt: "Guest bathroom with a backlit mirror and glass shower door" },
];

/** The two facilities the homepage Facilities section features. */
export const facilityHighlights: FacilityHighlight[] = [
  {
    id: "restaurant",
    title: "Multi-Cuisine Restaurant",
    badge: "Open 24x7",
    description:
      "Our rooftop restaurant serves hearty Gujarati thalis, continental classics and a global menu around the clock — a 2 AM arrival still finds dinner waiting.",
    image: "/images/dining/restaurant-main.jpg",
    icon: "UtensilsCrossed",
  },
  {
    id: "board-room",
    title: "Board Room",
    description:
      "A private board room for meetings, presentations and client discussions.",
    image: "/images/board-room/meeting-table.jpg",
    // Portrait photo in a landscape frame — keep the table and chairs in view.
    imagePosition: "center 70%",
    icon: "Presentation",
  },
];

/**
 * The homepage In & Around list, as the hotel sent it (2026-09-15): same
 * order, names and distances, with the Hinglish notes put into English.
 * Kept as sent on purpose — public sources put Khambhalida Caves nearer
 * 66 km and Rampara at 42–60 km, and Rajkot's zoo moved from Aji Dam to
 * Lalpari Lake in 2010. Confirm with the hotel before "correcting" them.
 */
export const nearbyPlaces: NearbyPlace[] = [
  {
    name: "Mahatma Gandhi Museum",
    note: "A 360° virtual tour of the whole museum is on Google",
  },
  {
    name: "Watson Museum - Jubilee Garden",
    note: "A famous museum from the British era",
  },
  {
    name: "Rotary Dolls Museum",
    note: "Dolls from all over the world — children will love it",
  },
  { name: "Kaba Gandhi No Delo", note: "Gandhiji's childhood home" },
  { name: "BAPS Swaminarayan Temple, Kalawad Road" },
  { name: "Race Course Garden & Lake" },
  { name: "Aji Dam Garden & Zoo" },
  {
    name: "Khambhalida Caves (near Gondal)",
    note: "A 360° view of the Buddhist caves",
    distance: "40 km",
  },
  { name: "Naulakha Palace, Gondal", note: "Royal palace virtual tour" },
  { name: "Rampara Wildlife Sanctuary", distance: "65 km" },
  { name: "Jalaram Mandir, Virpur", distance: "55 km" },
  { name: "Sasan Gir National Park", note: "Lion safari", distance: "160 km" },
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
    text: "We hosted a two-day sales conference at Golden Glory. The board room had everything we needed — projector, sound system, good lighting. The staff went out of their way to accommodate last-minute changes. Will book again.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Chartered Accountant",
    location: "Rajkot",
    text: "I recommend Golden Glory to all my clients visiting Rajkot. The location on Canal Road is convenient, the Suite Room is genuinely impressive for the price, and the service is consistently reliable. A gem in Rajkot's hospitality scene.",
    rating: 5,
  },
];

/**
 * Where the map pin sits and where "Get Directions" goes — shared by the
 * footer and the contact page.
 */
export const hotelLocation = {
  // `q=` with bare coordinates drops a pin on the hotel without pulling in
  // Google's place card, which still shows an outdated registered address.
  embedUrl:
    "https://www.google.com/maps?q=22.2889399,70.8018359&z=17&output=embed",
  // Directions to the exact pin the hotel shared (22°17'20.2"N 70°48'06.6"E),
  // not the business listing, whose address is out of date.
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=22.2889399,70.8018359",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * 35-second property tour, hosted on Firebase Storage.
 *
 * Two encodes rather than one: the desktop file averages ~2.8 Mbps and would
 * buffer on a weak mobile connection, so <VideoShowcase> picks `mobile`
 * (~1.4 Mbps) below the lg breakpoint. Regenerate both with
 * `npm run video:encode && npm run video:upload`.
 *
 * The URLs carry a per-object download token and a `<uuid>` path segment, so
 * replacing the video produces entirely new URLs and busts every cache for
 * free — the same scheme room images use.
 */
export const promoVideo: {
  sources: { desktop: string; mobile: string };
  poster: GalleryImage;
  durationSeconds: number;
  /**
   * Not rendered anywhere — the player sits under the Welcome heading, which
   * supplies its on-page context. This exists for the VideoObject structured
   * data on the homepage, where a description is required.
   */
  description: string;
} = {
  sources: {
    desktop:
      "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2F1920.mp4?alt=media&token=31628c62-0433-4aee-b939-46537f57f8b7",
    mobile:
      "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2F1280.mp4?alt=media&token=40357b8e-aa24-4f25-b2a9-8f516ae0ad87",
  },
  poster: {
    original:
      "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-original.jpg?alt=media&token=55a6123e-9ca1-4955-95d5-4661b8a2f46a",
    width: 3840,
    height: 1920,
    alt: "Hotel Golden Glory's facade lit in warm gold at night",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAKABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAIEBf/EACMQAAIABQQCAwAAAAAAAAAAAAECAAMEERIFEyExMnFBUWH/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAGxEAAgIDAQAAAAAAAAAAAAAAAAECIRESYUH/2gAMAwEAAhEDEQA/AOPVUyzGls6hQllNuCViGo6Z2RZWWWQ7PYitQZmnDIk8Ds/sNOAWtkleDc8j0YJbO8iUvDVtsiImGAUWAx+L+oQq3be8j19whXDoanw//9k=",
    variants: {
      avif: [
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-640.avif?alt=media&token=e0170b7d-518e-42f3-a924-dbc50ca23181",
          width: 640,
          height: 320,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-1024.avif?alt=media&token=c70c7b8c-8a06-40ab-94dd-3c7ba505a915",
          width: 1024,
          height: 512,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-1600.avif?alt=media&token=e2cd6dee-4099-465d-bc89-2d38838071c2",
          width: 1600,
          height: 800,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-2400.avif?alt=media&token=4f270726-865d-4c59-95a0-13dbbefc4a06",
          width: 2400,
          height: 1200,
        },
      ],
      webp: [
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-640.webp?alt=media&token=6435d88b-abe0-400f-a303-cdca164038cd",
          width: 640,
          height: 320,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-1024.webp?alt=media&token=2403e7f7-6951-43a2-a04d-e8555e9a958b",
          width: 1024,
          height: 512,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-1600.webp?alt=media&token=a015cdd8-4862-4304-89b5-2056e137af35",
          width: 1600,
          height: 800,
        },
        {
          url: "https://firebasestorage.googleapis.com/v0/b/hotelgoldenglory-79cab.firebasestorage.app/o/videos%2Fpromo%2Fa3ed2f0d-296d-414c-8620-b034afa94fcd%2Fposter-2400.webp?alt=media&token=90908947-05a2-4335-86d0-0964107a97de",
          width: 2400,
          height: 1200,
        },
      ],
    },
  },
  durationSeconds: 34.783,
  description:
    "A 35-second tour of Hotel Golden Glory in Rajkot — the lit facade after dark, the reception desk, the guest rooms, and the rooftop restaurant, filmed on the property.",
};
