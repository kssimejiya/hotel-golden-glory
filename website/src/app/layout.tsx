import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { hotelInfo } from "@/lib/content";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Explicit viewport override of Next.js's default. The critical bit is
// `maximumScale: 1` — without it, iOS Safari auto-zooms in on form-input
// focus whenever the input's font-size is even microscopically below 16px
// (rendering rounding, accessibility text-scale settings, etc. all push
// over the threshold intermittently). The page then becomes wider than
// the viewport and the user has to manually pinch-zoom out to recover —
// which is exactly the bug the user is reporting.
//
// On iOS 10+, Safari respects `maximum-scale=1` for the auto-zoom-on-
// focus behavior but *ignores* it for user-initiated pinch-zoom (Apple
// chose this for accessibility). So this setting blocks the unwanted
// auto-zoom while preserving the user's ability to zoom manually for
// reading. This is the canonical fix.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// metadataBase resolves relative OG / Twitter image URLs to absolute ones for
// social-card scrapers (Twitter, Slack, Facebook). Without this, any room
// whose heroImage is a local /images/... path would ship a relative OG image
// URL that scrapers can't fetch.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hotel Golden Glory — Contemporary Luxury Hotel in Rajkot",
    template: "%s | Hotel Golden Glory",
  },
  description:
    "A contemporary 4-star luxury hotel on Canal Road, Rajkot — well-appointed rooms, city-view balconies, a rooftop restaurant and warm Gujarati hospitality.",
  keywords: [
    "hotel rajkot",
    "luxury hotel rajkot",
    "4 star hotel rajkot",
    "business hotel rajkot",
    "hotel golden glory",
    "golden glory hotel rajkot",
    "rajkot accommodation",
    "rooftop restaurant rajkot",
    "board room rajkot",
    "hotel on canal road rajkot",
    "hotel near bhutkhana chowk rajkot",
    "hotel in bhakti nagar rajkot",
  ],
  openGraph: {
    title: "Hotel Golden Glory — Contemporary Luxury Hotel in Rajkot",
    description:
      "Contemporary 4-star comfort on Canal Road, Rajkot — a seamless blend of business and leisure, with hospitality that is truly Gujarati at heart.",
    type: "website",
    locale: "en_IN",
    siteName: "Hotel Golden Glory",
  },
};

const hotelJsonLd = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: "Hotel Golden Glory",
  description: hotelInfo.description,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${hotelInfo.address.street}, ${hotelInfo.address.area}`,
    addressLocality: hotelInfo.address.city,
    addressRegion: hotelInfo.address.state,
    postalCode: hotelInfo.address.zip,
    addressCountry: "IN",
  },
  telephone: [hotelInfo.phone, hotelInfo.phone2],
  email: hotelInfo.email,
  priceRange: "₹3000 - ₹4500",
  checkinTime: "14:00",
  checkoutTime: "11:00",
  numberOfRooms: 34,
  starRating: {
    "@type": "Rating",
    ratingValue: "4",
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
    { "@type": "LocationFeatureSpecification", name: "Free Parking", value: true },
    { "@type": "LocationFeatureSpecification", name: "Valet Parking", value: true },
    { "@type": "LocationFeatureSpecification", name: "24-Hour Front Desk", value: true },
    { "@type": "LocationFeatureSpecification", name: "Rooftop Restaurant", value: true },
    { "@type": "LocationFeatureSpecification", name: "Breakfast Buffet", value: true },
    { "@type": "LocationFeatureSpecification", name: "24/7 Dining", value: true },
    { "@type": "LocationFeatureSpecification", name: "Board Room", value: true },
    { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
