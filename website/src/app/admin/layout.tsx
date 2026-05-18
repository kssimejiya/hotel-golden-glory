import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin — Hotel Golden Glory",
    template: "%s | Admin — Hotel Golden Glory",
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
