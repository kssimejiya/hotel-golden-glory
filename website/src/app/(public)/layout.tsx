import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookingBar } from "@/components/layout/MobileBookingBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {/* pb-24 on mobile clears the fixed MobileBookingBar (~72px + safe area)
          so the footer's bottom edge isn't permanently hidden behind it. */}
      <main className="flex-1 pb-24 sm:pb-0">{children}</main>
      <Footer />
      <MobileBookingBar />
    </>
  );
}
