"use client";
import { GithubLogo, LinkedinLogo, Moon, Sun, TwitterLogo, X } from "@phosphor-icons/react/dist/ssr";
import { useContext } from "react";
import { ThemeContext } from "app/_contexts/theme-provider";
import { Separator } from "./separator";

const defaultIconClass = "w-6 h-6 text-muted dark:text-muted-dark transition duration-100";

const links = [
    {
        icon: GithubLogo,
        href: "https://github.com/borisnezlobin",
        title: "View my code at your own risk",
        color: "hover:text-[#333333] hover:dark:text-[#fafafa]",
    },
    {
        icon: TwitterLogo,
        href: "https://twitter.com/Rand0mLetterz",
        title: "I didn't have an \"X\" icon so here's the birb",
        color: "hover:text-[#1c9cea] dark:hover:text-[#1c9cea]",
    },
    {
        icon: LinkedinLogo,
        href: "https://www.linkedin.com/in/boris-nezlobin-3987a8242/",
        title: "If for some reason you want to hire me (I wouldn't be against it)",
        color: "hover:text-[#0077b5] dark:hover:text-[#0077b5]",
    },
]

const defaultColor = " hover:text-primary dark:hover:text-primary";

const SocialLinksBubble = () => {
    const { theme, setTheme } = useContext(ThemeContext);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    }

    return (
        <div className="fixed bottom-4 right-4 flex flex-row items-center justify-center gap-4 border border-muted dark:border-muted-dark p-2 px-6 rounded-full shadow-lg bg-light-background dark:bg-dark-background">
            {links.map(({ icon: Icon, href, color, title }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" key={href} title={title}>
                    <Icon className={`${defaultIconClass} ${color}`} weight="fill"/>
                </a>
            ))}
            <Separator vertical={false} />
            <button className="w-6 h-6 text-gray-500 transition duration-100 hover:text-primary dark:hover:text-primary" onClick={toggleTheme}>
                {theme === "light" ? <Moon className={defaultIconClass + defaultColor} /> : <Sun className={defaultIconClass + defaultColor} />}
            </button>
        </div>
    );
};

export default SocialLinksBubble;