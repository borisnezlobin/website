import { ReactNode } from "react";
import { ScrollForMore } from "../components/landing/scroll-for-more";
import getMetadata from "../lib/metadata";
import { DiscordLogo, Envelope, GithubLogo, Globe, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { Separator } from "@/components/separator";

export const metadata = getMetadata({
    title: "Contact Me",
    info: "Questions, comments, suggestions?",
});

const ContactType = ({ title, icon, url, urlTitle }: { title: string, icon: ReactNode, url: string, urlTitle?: string }) => {
    return (
        <div className="flex flex-col gap-2 justify-center md:items-start">
            <h3 className="text-2xl font-bold dark:text-dark flex gap-4 justify-center items-center">
                {icon}
                {title}
            </h3>
            <a href={url} title={urlTitle ? urlTitle : title} className="link underline font-semibold">
                {urlTitle ? urlTitle : url}
            </a>
        </div>
    );
}

const CONTACT_TYPES = [
    {
        title: "Email",
        icon: <Envelope />,
        urlTitle: "boris.nezlobin@gmail.com",
        url: "mailto:borisnezlobin@gmail.com",
    },
    {
        title: "GitHub",
        icon: <GithubLogo />,
        urlTitle: "borisnezlobin",
        url: "https://github.com/borisnezlobin",
    },
    {
        title: "LinkedIn",
        icon: <LinkedinLogo />,
        urlTitle: "borisnezlobin",
        url: "https://www.linkedin.com/in/borisnezlobin",
    },
    {
        title: "Discord",
        icon: <DiscordLogo />,
        urlTitle: "_randomletters",
        url: "https://discord.com/users/801815917969276978",
    },
    {
        title: "Website",
        icon: <Globe />,
        urlTitle: "bnezlobin.vercel.app",
        url: "https://bnezlobin.vercel.app",
    }
];


const ContactMePage = () => {
    return (
        <main className="flex flex-col justify-center items-start mb-[30vh] p-4 lg:p-0">
            <div className="h-[100svh] print:hidden relative top-[-3rem] items-center w-full flex flex-col justify-center p-4 gap-4">
                <h1 className="text-3xl font-bold dark:text-dark text-center md:text-4xl lg:text-5xl">
                    Want to reach out?
                </h1>
                <p className="text-base md:text-2xl">
                    Here's how.
                </p>
            </div>
            <ScrollForMore />
            <div className="w-full flex flex-col md:flex-row print:flex-col flex-wrap gap-8 justify-start items-center md:justify-center md:items-center print:justify-start print:items-start">
                {CONTACT_TYPES.map((e, i) => {
                    return (
                        <div className="flex gap-8" key={`contact ${i}`}>
                            <ContactType
                                title={e.title}
                                icon={e.icon}
                                url={e.url}
                                urlTitle={e.urlTitle}
                            />
                            {i < CONTACT_TYPES.length - 1 && <Separator size="xlarge" className="hidden md:block print:hidden" />}
                        </div>
                    );
                })}
            </div>
        </main>
    );
};

export default ContactMePage;