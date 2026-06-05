import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

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
    default: "Hotel Golden Glory — Modern Business Hotel in Rajkot",
    template: "%s | Hotel Golden Glory",
  },
  description:
    "34 thoughtfully designed rooms, 24/7 multi-cuisine dining, and conference facilities. Exceptional value, exceptional service in the heart of Rajkot, Gujarat.",
  keywords: [
    "hotel rajkot",
    "business hotel rajkot",
    "hotel golden glory",
    "golden glory hotel rajkot",
    "rajkot accommodation",
    "conference hall rajkot",
    "hotel near bhakti nagar",
  ],
  openGraph: {
    title: "Hotel Golden Glory — Modern Business Hotel in Rajkot",
    description:
      "34 rooms, 4 categories, 24/7 dining, conference facilities. Exceptional value in the heart of Rajkot.",
    type: "website",
    locale: "en_IN",
    siteName: "Hotel Golden Glory",
  },
};

const hotelJsonLd = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: "Hotel Golden Glory",
  description:
    "A modern business hotel in Rajkot offering 34 thoughtfully designed rooms across 4 categories, 24/7 multi-cuisine dining, and versatile conference facilities.",
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "Kanta Stri Vikas Grah Road, Near Bhutkhana Petrol Pump, Millpara, Bhakti Nagar",
    addressLocality: "Rajkot",
    addressRegion: "Gujarat",
    postalCode: "360002",
    addressCountry: "IN",
  },
  telephone: "+91 9081354542",
  email: "info@hotelgoldenglory.com",
  priceRange: "₹2799 - ₹5199",
  checkinTime: "14:00",
  checkoutTime: "12:00",
  numberOfRooms: 34,
  starRating: {
    "@type": "Rating",
    ratingValue: "3",
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
    { "@type": "LocationFeatureSpecification", name: "24/7 Dining", value: true },
    { "@type": "LocationFeatureSpecification", name: "Conference Hall", value: true },
    { "@type": "LocationFeatureSpecification", name: "Free Parking", value: true },
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
