"use client"
import { createContext, useEffect, useState } from "react";
import SocialLinksBubble from "@/components/social-links";
import { Inter } from "next/font/google";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}


const inter = Inter({ subsets: ['latin'] })

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

interface ThemeProviderProps { children: React.ReactNode; };

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // shit does NOT work atm
    let storedTheme: Theme = "light";
    if (typeof window !== 'undefined') {
        storedTheme = localStorage.getItem('theme') as Theme;
    }
    const [theme, setTheme] = useState<Theme>(storedTheme);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <body className={`${inter.className} ${theme === "dark" ? "dark" : ""} `}>
                <div className="w-full min-h-screen flex flex-col bg-light-background dark:bg-dark-background transition-all duration-300">
                    {children}
                    <SocialLinksBubble />
                </div>
            </body>
        </ThemeContext.Provider>
    );
}

export { ThemeProvider, ThemeContext };