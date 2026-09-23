import type { Metadata } from "next";

export const metadata: Metadata = { title: "Photography" };

export default function PhotographyAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
