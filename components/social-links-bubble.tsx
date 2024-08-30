"use client";

import { useTheme } from "next-themes";
import { SocialLinks } from "./social-links";
import { Separator } from "./separator";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";

const defaultColor = " hover:text-primary dark:hover:text-primary";
const defaultIconClass =
  "w-6 h-6 text-muted dark:text-muted-dark transition duration-100";

const SocialLinksBubble = () => {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        console.log("theme", resolvedTheme);
        setTheme(resolvedTheme === "light" ? "dark" : "light");
    };

    return (
        <div className="print:hidden fixed flex bottom-4 z-10 right-4 flex-row items-center justify-center gap-4 border border-muted dark:border-muted-dark p-4 md:p-2 md:px-6 rounded-full shadow-lg bg-light-background dark:bg-dark-background">
            <span className="hidden md:flex flex-row justify-center items-center gap-4">
                <SocialLinks />
            </span>
            <Separator vertical={false} className="hidden md:block" />
            <button
                className="w-6 h-6 text-gray-500 transition duration-100 hover:text-primary-dark dark:hover:text-primary-dark"
                onClick={toggleTheme}
                aria-label="Change theme"
            >
                {resolvedTheme === "light" ? (
                    <Moon className={defaultIconClass + defaultColor} />
                ) : (
                    <Sun className={defaultIconClass + defaultColor} />
                )}
            </button>
        </div>
    );
};

export default SocialLinksBubble;