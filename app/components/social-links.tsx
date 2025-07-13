import {
    GithubLogo,
    LinkedinLogo,
    XLogo,
} from "@phosphor-icons/react/dist/ssr";
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
        href: "https://www.linkedin.com/in/borisnezlobin/",
        title: "If for some reason you want to hire me (I wouldn't be against it)",
        color: "hover:text-[#0077b5] dark:hover:text-[#0077b5]",
    },
];

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

export { SocialLinks };
