import type { ReactNode } from "react";
import { ArrowRightIcon, ArrowUpRightIcon, GithubLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { ActionLink } from "@/app/components/action";

export const isInternalHref = (href: string) => href.startsWith("/");

export function linkIconFor(href: string) {
    if (isInternalHref(href)) return <ArrowRightIcon size={16} />;
    if (href.includes("github.com")) return <GithubLogoIcon size={18} />;
    return <ArrowUpRightIcon size={16} />;
}

const NEW_TAB_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;

type ProjectLinkProps = {
    href: string;
    children: ReactNode;
    icon?: ReactNode;
    className?: string;
};

export function ProjectLink({ href, children, icon, className = "" }: ProjectLinkProps) {
    const external = !isInternalHref(href);
    return (
        <ActionLink
            href={href}
            icon={icon}
            className={`-mx-1 min-h-11 ${className}`}
            {...(external ? NEW_TAB_PROPS : {})}
        >
            {children}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
        </ActionLink>
    );
}
