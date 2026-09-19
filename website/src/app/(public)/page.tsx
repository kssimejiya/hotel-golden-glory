import { Hero } from "@/components/sections/Hero";
import { WelcomeStrip } from "@/components/sections/WelcomeStrip";
import { RoomCategoriesPreview } from "@/components/sections/RoomCategoriesPreview";
import { FacilitiesSection } from "@/components/sections/FacilitiesSection";
import { InAndAroundSection } from "@/components/sections/InAndAroundSection";
import { SpecialOfferBanner } from "@/components/sections/SpecialOfferBanner";
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
  description: promoVideo.description,
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
      {/* Section order is the hotel's final website structure: photo slider,
          welcome, rooms, facilities — then In & Around, the brief's nearby
          places that the hotel wants on the homepage, and the honeymoon
          special offer, which the hotel chose to keep. Address and map live
          in the footer. */}
      <Hero />
      {/* The property tour player lives inside WelcomeStrip, between its
          heading and description — it is not a section of its own. */}
      <WelcomeStrip />
      <RoomCategoriesPreview rooms={rooms} />
      <FacilitiesSection />
      <InAndAroundSection />
      <SpecialOfferBanner />
      {/* <TestimonialsSection /> */}
    </>
  );
}
