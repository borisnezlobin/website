"use client"
import { createContext, useEffect, useState } from "react";
import useLocalStorage from "../utils/use-local-storage";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

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
            <div className={theme === "dark" ? "dark" : ""}>
                <div className={`bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-background`}>
                    {children}
                </div>
            </div>
        </ThemeContext.Provider>
    );
}

export { ThemeProvider, ThemeContext };