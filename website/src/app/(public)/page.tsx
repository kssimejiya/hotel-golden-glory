import { Hero } from "@/components/sections/Hero";
import { WelcomeStrip } from "@/components/sections/WelcomeStrip";
import { RoomCategoriesPreview } from "@/components/sections/RoomCategoriesPreview";
import { VideoShowcase } from "@/components/sections/VideoShowcase";
import { AmenitiesGrid } from "@/components/sections/AmenitiesGrid";
import { ReceptionPreview } from "@/components/sections/ReceptionPreview";
import { DiningPreview } from "@/components/sections/DiningPreview";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { roomRepo } from "@/lib/firebase/roomRepo";
import { hotelInfo, promoVideo } from "@/lib/content";

/**
 * VideoObject for the property tour. Lives on the homepage rather than in the
 * root layout because that is the only page the video appears on — a sitewide
 * VideoObject would claim every page hosts it.
 */
const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: `${hotelInfo.name} — Property Tour`,
  description: promoVideo.body,
  thumbnailUrl: [promoVideo.poster.original],
  uploadDate: "2026-08-09",
  // ISO 8601. schema.org durations are conventionally whole seconds.
  duration: `PT${Math.round(promoVideo.durationSeconds)}S`,
  contentUrl: promoVideo.sources.desktop,
};

export default async function Home() {
  const rooms = await roomRepo.list();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <Hero />
      <WelcomeStrip />
      <RoomCategoriesPreview rooms={rooms} />
      <VideoShowcase />
      <AmenitiesGrid />
      <ReceptionPreview />
      <DiningPreview />
      {/* <TestimonialsSection /> */}
    </>
  );
}
