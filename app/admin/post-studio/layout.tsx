import type { Metadata } from "next";

export const metadata: Metadata = { title: "Post studio" };

export default function PostStudioAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
