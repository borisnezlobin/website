import { ReactNode } from "react";
import { ScrollForMore } from "../../components/landing/scroll-for-more";
import getMetadata from "../../lib/metadata";
import { CheckSquareIcon, DiscordLogo, Envelope, GithubLogo, Globe, LinkedinLogo, CheckIcon, XLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Separator } from "@/app/components/separator";

export const metadata = getMetadata({
    title: "Contact Me",
    description: "Questions, comments, suggestions? Find me on GitHub, LinkedIn, or send me an email.",
    subtitle: "Boris Nezlobin."
});

const ContactType = ({ title, icon, url, urlTitle, description, professionalism }: { title: string, icon: ReactNode, url: string, urlTitle?: string, description?: string, professionalism: number }) => {
    return (
        <a 
            href={url} 
            target="_blank" 
            className="border overflow-clip h-full border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 hover:dark:border-neutral-400 relative group cursor-pointer w-full p-4 rounded-lg tranition-transform duration-300 hover:shadow-lg hover:-translate-y-px"
        >
            <div className={`absolute top-2 right-2 w-2 h-2 opacity-70 rounded-sm ${professionalismGradient(professionalism)}`}>
            </div>
            <div className="flex flex-col h-full items-center text-center space-y-3">
                <h3 className="flex flex-row items-center justify-center space-x-2 text-xl font-bold text-light dark:text-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors duration-300">
                    <span className="text-xl">{icon}</span>
                    <p>{title}</p>
                </h3>
                {/* <Separator vertical={true} /> */}
                <p className="emph">
                    {urlTitle || url}
                </p>
                {description && (
                    <p className="text-sm text-muted dark:text-muted-dark opacity-80">
                        {description}
                    </p>
                )}
            </div>
        </a>
    );
}

const CONTACT_TYPES = [
    {
        title: "Email",
        icon: <Envelope />,
        urlTitle: "boris.nezlobin@gmail.com",
        url: "mailto:borisnezlobin@gmail.com",
        // description: "Best way to reach me for work or projects",
        professionalism: 1.0
    },
    {
        title: "GitHub",
        icon: <GithubLogo />,
        urlTitle: "borisnezlobin",
        url: "https://github.com/borisnezlobin",
        // description: "Check out my code and contributions",
        professionalism: 0.9
    },
    {
        title: "Linkedin",
        icon: <LinkedinLogo />,
        urlTitle: "borisnezlobin",
        url: "https://www.linkedin.com/in/borisnezlobin",
        // description: "Professional networking and experience",
        professionalism: 1.0
    },
    {
        title: "Discord",
        icon: <DiscordLogo />,
        urlTitle: "_randomletters",
        url: "https://discord.com/users/801815917969276978",
        // description: "Chat about tech, games, or random stuff",
        professionalism: 0.2
    },
    {
        title: "Website",
        icon: <Globe />,
        urlTitle: "borisn.dev",
        url: "https://borisn.dev",
        // description: "You're already here! But here's the link anyway",
        professionalism: 0.8
    },
    {
        title: "Twitter",
        icon: <XLogoIcon />,
        urlTitle: "b_nezlobin",
        url: "https://x.com/b_nezlobin",
        // description: "Thoughts, updates, and occasional hot takes",
        professionalism: 0.4
    }
];

const professionalismGradient = (level: number) => {
    if (level >= 0.75) return "bg-green-800 dark:bg-green-600";
    if (level >= 0.5) return "bg-yellow-600 dark:bg-yellow-400";
    if (level >= 0.25) return "bg-orange-600 dark:bg-orange-400";
    return "bg-red-800 dark:bg-red-600";
}


const ContactMePage = () => {
    const sortedContactTypes = CONTACT_TYPES.sort((a, b) => b.professionalism - a.professionalism);
    return (
        <main className="print:min-h-[calc(100svh-8rem)] flex flex-col justify-center items-start mb-12 md:mb-[30vh] p-4 lg:p-0 select-text">
            <div className="h-[100svh] print:hidden relative top-[-3rem] items-center w-full flex flex-col justify-center p-4 gap-4">
                <h1 className="text-3xl font-bold text-center md:text-4xl lg:text-5xl">
                    Want to reach out?
                </h1>
                <p className="text-base md:text-2xl emph">
                    I mostly don&apos;t bite :)
                </p>
            </div>
            <ScrollForMore />
            <div className="w-full max-w-6xl mx-auto">
                <div className="text-center mb-12 print:mb-6">
                    <p className="text-muted dark:text-muted-dark max-w-2xl mx-auto">
                        Whether you want to collaborate on a project, ask a question, or say hi, 
                        I&apos;m looking forward to hearing from you!
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                    {sortedContactTypes.map((e, i) => (
                        <ContactType
                            key={`contact ${i}`}
                            title={e.title}
                            professionalism={e.professionalism}
                            icon={e.icon}
                            url={e.url}
                            urlTitle={e.urlTitle}
                        />
                    ))}
                </div>
                <div className="mt-12 text-center print:hidden">
                    <p className="text-muted dark:text-muted-dark mb-4">
                        Ranked by level of corporate-ness. Use whichever works best for you!
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-600">
                        <span className="rounded-full animate-pulse">
                            <CheckSquareIcon className="text-green-800" weight={"fill"} />
                        </span>
                        <span className="text-sm text-muted dark:text-muted-dark">
                            I&apos;m chronically online
                        </span>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ContactMePage;