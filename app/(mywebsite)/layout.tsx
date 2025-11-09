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
                            <div className="w-full fixed z-20 top-0 left-0 px-4 print:hidden bg-background h-12">
                                <div className="flex flex-row justify-around h-full md:justify-start md:pl-6 md:gap-24 w-full md:w-2/3 items-center bg-light-background dark:bg-dark-background">
                                    <Link href={"/"} className="link">
                                        Home.
                                    </Link>
                                    <Link href={"/blog"} className="link !hidden md:!block">
                                        Blog.
                                    </Link>
                                    <Link href={"/projects"} className="link">
                                        Projects.
                                    </Link>
                                    <Link href={"/notes"} className="link !hidden md:!block">
                                        Notes.
                                    </Link>
                                    <Link href={"/contact"} className="link">
                                        Contact.
                                    </Link>
                                </div>
                            </div>
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
