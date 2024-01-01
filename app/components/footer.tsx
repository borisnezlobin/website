import { Separator } from "@/components/separator";
import { TextAlignCenter, Atom, House, GithubLogo, LinkedinLogo, TwitterLogo } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

const LinkWithIcon = ({ href, children, Icon }: { href: string, children?: React.ReactNode, Icon: any }) => {
    return (
        <Link href={href} target={href.startsWith("/") ? "_self" : "_blank"} className="flex flex-row justify-start items-center gap-2 group cursor-pointer">
            <Icon className="w-6 h-6 transition-all duration-300 group-hover:text-primary dark:group-hover:text-primary-dark" />
            <p className="group-hover:text-primary dark:group-hover:text-primary-dark">
                {children}
            </p>
        </Link>
    );
}

const Footer = () => {
    return (
        <footer className="w-full mt-4 flex flex-wrap pl-8 justify-start items-center py-12 border-t gap-8 border-muted dark:border-muted-dark">
            <section>
                <p className="text-muted dark:text-muted-dark mb-2">Quick links</p>
                <ul className="flex flex-row gap-2 justify-start items-start">
                    <LinkWithIcon href="/" Icon={House}>
                        Home
                    </LinkWithIcon>
                    <Separator />
                    <LinkWithIcon href="/projects" Icon={Atom}>
                        Projects
                    </LinkWithIcon>
                    <Separator />
                    <LinkWithIcon href="/blog" Icon={TextAlignCenter}>
                        Blog
                    </LinkWithIcon>
                </ul>
            </section>

            <Separator size="xlarge" className="hidden md:flex" />

            <section>
                <p className="text-muted dark:text-muted-dark mb-2">Contact Me</p>
                <ul className="flex flex-row gap-2 justify-start items-start">
                    <LinkWithIcon href="https://github.com/borisnezlobin" Icon={GithubLogo} />
                    {/* <Separator /> */}
                    <LinkWithIcon href="https://www.linkedin.com/in/boris-nezlobin-3987a8242/" Icon={LinkedinLogo} />
                    {/* <Separator /> */}
                    <LinkWithIcon href="https://x.com/Rand0mLetterz" Icon={TwitterLogo} />
                </ul>
            </section>

            <p className="w-full text-muted dark:text-muted-dark text-center mt-8">
                © 2024 Boris Nezlobin. All rights reserved.
            </p>
        </footer>
    );
}

export default Footer;