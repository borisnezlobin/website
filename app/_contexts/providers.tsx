"use client"

import SocialLinksBubble from "@/components/social-links";
import { ThemeProvider } from "next-themes";

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ThemeProvider attribute="class">
            <div className="w-screen min-w-screen min-h-[100svh] print:min-h-0 bg-light-background dark:bg-dark-background transition-all duration-300">
                <div className="w-full max-w-5xl mx-auto">
                    {children}
                </div>
                <SocialLinksBubble />
            </div>
        </ThemeProvider>
    );
}

export default Providers;