import "./globals.css";
import Providers from "./_contexts/providers";
import getMetadata from "./lib/metadata";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./light.css";
import "./dark.css";
import Script from "next/script";
import Footer from "./components/footer";

export const metadata = getMetadata({});
// {
//   title: 'Boris Nezlobin',
//   description:
//     "I'm a software engineer, full-stack developer, and computer science student. I'm passionate about building things that make people's lives easier.",
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <link href="prism.css" rel="stylesheet" /> */}
        {/* <link href="prism/dark.css" rel="stylesheet" /> */}
      </head>
      <body suppressHydrationWarning>
        {/* <script src="/prism.js"></script> */}
        <Script src="https://unpkg.com/prismjs@v1.x/components/prism-core.min.js"></Script>
        <Script src="https://unpkg.com/prismjs@v1.x/plugins/autoloader/prism-autoloader.min.js"></Script>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
