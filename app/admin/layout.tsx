import "../styles/globals.css";
import type { Metadata } from "next";
import AdminShell from "./components/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  description: "Boris Nezlobin's site admin.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
