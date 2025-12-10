"use client";

import { useTheme } from "next-themes";
import { SocialLinks } from "./social-links";
import { Separator } from "./separator";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const defaultColor = " hover:text-primary dark:hover:text-primary-dark";
const defaultIconClass =
  " w-6 h-6 text-muted dark:text-muted-dark transition duration-100";

const SocialLinksBubble = ({ themeOnly }: { themeOnly?: boolean | undefined }) => {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        console.log("theme", resolvedTheme);
        setTheme(resolvedTheme === "light" ? "dark" : "light");
    };

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return null;

    return (
        <div className={`print:hidden fixed flex bottom-4 z-30 right-4 flex-row items-center justify-center gap-4 border border-muted dark:border-muted-dark p-4 md:p-2 ${!themeOnly ? "md:px-6" : "md:p-4"} rounded-full shadow-lg bg-light-background dark:bg-dark-background`}>
            {!themeOnly && (
                <span className="hidden md:flex flex-row justify-center items-center gap-4">
                    <SocialLinks />
                </span>
            )}
            {!themeOnly && <Separator vertical={false} className="hidden md:block" />}
            <button
                className="w-6 h-6 text-gray-500 transition duration-100"
                onClick={toggleTheme}
                aria-label="Change theme"
            >
                {resolvedTheme === "light" ? (
                    <MoonIcon className={defaultIconClass + defaultColor} />
                ) : (
                    <SunIcon className={defaultIconClass + defaultColor} />
                )}
            </button>
        </div>
    );
};

export default SocialLinksBubble;