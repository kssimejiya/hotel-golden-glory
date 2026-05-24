import { Hero } from "@/components/sections/Hero";
import { WelcomeStrip } from "@/components/sections/WelcomeStrip";
import { RoomCategoriesPreview } from "@/components/sections/RoomCategoriesPreview";
import { AmenitiesGrid } from "@/components/sections/AmenitiesGrid";
import { ReceptionPreview } from "@/components/sections/ReceptionPreview";
import { DiningPreview } from "@/components/sections/DiningPreview";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { roomRepo } from "@/lib/firebase/roomRepo";

export default async function Home() {
  const rooms = await roomRepo.list();
  return (
    <>
      <Hero />
      <WelcomeStrip />
      <RoomCategoriesPreview rooms={rooms} />
      <AmenitiesGrid />
      <ReceptionPreview />
      <DiningPreview />
      {/* <TestimonialsSection /> */}
    </>
  );
}
