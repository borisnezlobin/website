import "../styles/globals.css";
import "../styles/obsidian.css";
import "../styles/code-styler.css";
import getMetadata from "../lib/metadata";
import Footer from "../components/footer";
import Link from "next/link";
import SocialLinksBubble from "@/app/components/social-links-bubble";
// import { ThemeProvider } from 'next-themes'
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Theme } from "../components/theme";
import TopBar from "../components/topbar";

export const metadata = getMetadata({});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                {/* <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" /> */}
            </head>
            <body suppressHydrationWarning>
                <Theme>
                    <div className="w-screen min-w-screen min-h-[100svh] print:min-h-0 bg-background">
                        <div className="w-full max-w-6xl mx-auto">
                            <TopBar />
                            <div className="w-full h-full pt-[3rem] print:pt-0 print:pb-4">
                                {children}
                            </div>
                            <Footer />
                        </div>
                        <SocialLinksBubble />
                    </div>
                </Theme>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
