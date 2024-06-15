"use client";
import {
  GithubLogo,
  LinkedinLogo,
  Moon,
  Sun,
  TwitterLogo,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Separator } from "./separator";
import { useTheme } from "next-themes";
import { IconWeight } from "@phosphor-icons/react";

const defaultIconClass =
  "w-6 h-6 text-muted dark:text-muted-dark transition duration-100";

const links = [
  {
    icon: GithubLogo,
    href: "https://github.com/borisnezlobin",
    weight: "regular",
    title: "View my code at your own risk",
    color: "hover:text-[#333333] hover:dark:text-[#fafafa]",
  },
  {
    icon: XLogo,
    weight: "regular",
    href: "https://twitter.com/Rand0mLetterz",
    title: "Incidentally similar to the blackboard bold capital X",
    color: "hover:text-[#1c9cea] dark:hover:text-[#1c9cea]",
  },
  {
    icon: LinkedinLogo,
    weight: "regular",
    href: "https://www.linkedin.com/in/boris-nezlobin-3987a8242/",
    title: "If for some reason you want to hire me (I wouldn't be against it)",
    color: "hover:text-[#0077b5] dark:hover:text-[#0077b5]",
  },
];

const defaultColor = " hover:text-primary dark:hover:text-primary";

const SocialLinks = () => {
  return (
    <>
      {links.map(({ icon: Icon, href, color, title, weight }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          key={href}
          title={title}
          aria-label={title}
        >
          <Icon
            className={`${defaultIconClass} ${color}`}
            weight={weight as IconWeight | undefined}
          />
        </a>
      ))}
    </>
  );
};

const SocialLinksBubble = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    console.log("theme", theme);
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="fixed flex bottom-4 z-10 right-4 flex-row items-center justify-center gap-4 border border-muted dark:border-muted-dark p-4 md:p-2 md:px-6 rounded-full shadow-lg bg-light-background dark:bg-dark-background">
      <span className="hidden md:flex flex-row justify-center items-center gap-4">
        <SocialLinks />
      </span>
      <Separator vertical={false} className="hidden md:block" />
      <button
        className="w-6 h-6 text-gray-500 transition duration-100 hover:text-primary dark:hover:text-primary"
        onClick={toggleTheme}
        aria-label="Change theme"
      >
        {theme === "light" ? (
          <Moon className={defaultIconClass + defaultColor} />
        ) : (
          <Sun className={defaultIconClass + defaultColor} />
        )}
      </button>
    </div>
  );
};

export default SocialLinksBubble;
export { SocialLinks };
