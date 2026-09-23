import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resume" };

export default function ResumeAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
