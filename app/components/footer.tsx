import { Separator } from "@/components/separator";
import { SocialLinks } from "@/components/social-links";
import {
  TextAlignCenter,
  Atom,
  House,
  GithubLogo,
  LinkedinLogo,
  TwitterLogo,
  XLogo,
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
    <footer className="w-full mt-4 flex flex-wrap md:pl-8 mb-12 md:mb-0 justify-start items-center py-12 border-t gap-8 border-muted dark:border-muted-dark">
      <section>
        <p className="pl-8 md:pl-0 text-muted dark:text-muted-dark mb-2">
          Quick links
        </p>
        <ul className="pl-8 md:pl-0 flex flex-row gap-2 justify-start items-start">
          <li>
            <LinkWithIcon title="Home" href="/" Icon={House}>
              Home
            </LinkWithIcon>
          </li>
          <li>
            <Separator />
          </li>
          <li>
            <LinkWithIcon title="Projects" href="/projects" Icon={Atom}>
              Projects
            </LinkWithIcon>
          </li>
          <li>
            <Separator />
          </li>
          <li>
            <LinkWithIcon title="Blog" href="/blog" Icon={TextAlignCenter}>
              Blog
            </LinkWithIcon>
          </li>
        </ul>
      </section>

      <Separator size="xlarge" className="hidden md:flex" />

      <section className="pl-8 md:pl-0 ">
        <p className="text-muted dark:text-muted-dark mb-2">Contact Me</p>
        {/* <ul className="flex flex-row gap-2 justify-start items-start">
          <li>
            <LinkWithIcon
              href="https://github.com/borisnezlobin"
              Icon={GithubLogo}
              title="GitHub"
            />
          </li>
          <li>
            <LinkWithIcon
              href="https://www.linkedin.com/in/boris-nezlobin-3987a8242/"
              Icon={LinkedinLogo}
              title="LinkedIn"
            />
          </li>
          <li>
            <LinkWithIcon
              href="https://x.com/Rand0mLetterz"
              Icon={XLogo}
              title="X (formerly Twitter)"
            />
          </li>
        </ul> */}
        <div className="flex flex-row gap-2 justify-start items-start">
          <SocialLinks />
        </div>
      </section>

      <p className="w-full text-muted dark:text-muted-dark text-center mt-8">
        © 2024 Boris Nezlobin. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
