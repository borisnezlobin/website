import { Separator } from "@/app/components/separator";
import { SocialLinks } from "@/app/components/social-links";
import {
    TextAlignCenter,
    Atom,
    House,
    AddressBook,
    HighlighterCircle,
    Newspaper,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const LinkWithIcon = ({
    href,
    title,
    children,
    Icon,
}: {
    href: string;
    title: string;
    children?: React.ReactNode;
    Icon: any;
}) => {
    return (
        <Link
            href={href}
            aria-label={title}
            target={href.startsWith("/") ? "_self" : "_blank"}
            className="flex flex-row justify-start items-center gap-2 group cursor-pointer"
        >
            <Icon className="w-6 h-6 transition-all duration-300 group-hover:text-primary dark:group-hover:text-primary-dark" />
            <p className="group-hover:text-primary dark:group-hover:text-primary-dark">
                {children}
            </p>
        </Link>
    );
};

const Footer = () => {
    return (
        <>
            <footer className="print:hidden w-full mt-4 flex flex-wrap md:pl-8 pb-24 justify-start items-center py-12 border-t gap-8 border-muted dark:border-muted-dark">
                <section>
                    <p className="pl-8 md:pl-0 text-muted dark:text-muted-dark mb-2">
                        About Me
                    </p>
                    <div className="pl-8 md:pl-0 flex flex-row gap-2 justify-start items-start flex-wrap">
                        <span>
                            <LinkWithIcon title="Home" href="/" Icon={House}>
                                Home
                            </LinkWithIcon>
                        </span>
                        <span>
                            <Separator />
                        </span>
                        <span>
                            <LinkWithIcon title="Contact" href="/contact" Icon={AddressBook}>
                                Contact
                            </LinkWithIcon>
                        </span>
                    </div>
                </section>

                <Separator size="xlarge" className="hidden md:flex" />

                <section>
                    <p className="pl-8 md:pl-0 text-muted dark:text-muted-dark mb-2">
                        My Work
                    </p>
                    <div className="pl-8 md:pl-0 flex flex-row gap-2 justify-start items-start flex-wrap">
                        <span>
                            <LinkWithIcon title="Projects" href="/projects" Icon={Atom}>
                                Projects
                            </LinkWithIcon>
                        </span>
                        <span>
                            <Separator />
                        </span>
                        <span>
                            <LinkWithIcon title="Blog" href="/blog" Icon={Newspaper}>
                                Blog
                            </LinkWithIcon>
                        </span>
                        <span>
                            <Separator />
                        </span>
                        <span>
                            <LinkWithIcon title="Notes" href="/notes" Icon={HighlighterCircle}>
                                Notes
                            </LinkWithIcon>
                        </span>
                    </div>
                </section>

                <Separator size="xlarge" className="hidden md:flex" />

                <section className="pl-8 md:pl-0 md:pr-8">
                    <p className="text-muted dark:text-muted-dark mb-2">Contact Me</p>
                    <div className="flex flex-row gap-2 justify-start items-start flex-wrap">
                        <SocialLinks />
                    </div>
                </section>

                <p className="w-full text-muted dark:text-muted-dark text-center mt-8">
                    Copyright Boris Nezlobin 2024. All rights reserved.
                </p>
            </footer>

            <p aria-hidden className="w-full text-center hidden print:flex gap-4 justify-between items-center print-footer border-t pt-4 border-muted">
                <Link href="https://borisn.dev" className="font-bold underline">
                    borisn.dev
                </Link>
                <span className="text-muted dark:text-muted-dark">
                    Copyright Boris Nezlobin 2024. All rights reserved.
                </span>
            </p>
        </>
    );
};

export default Footer;
