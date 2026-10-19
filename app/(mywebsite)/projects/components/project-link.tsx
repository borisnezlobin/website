import Link from "next/link";
import type { ReactNode } from "react";
import { FOCUS_RING } from "@/app/components/action";

export const isInternalHref = (href: string) => href.startsWith("/");

const NEW_TAB_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;

type ProjectLinkProps = { href: string; children: ReactNode; className?: string };

/** A link styled like the ones in articles (globals.css), with room to hit and a focus ring. External links open in a new tab. */
export function ProjectLink({ href, children, className = "" }: ProjectLinkProps) {
    const external = !isInternalHref(href);
    return (
        <Link href={href} className={`prose-link inline-flex min-h-11 items-center rounded-sm font-bold transition-colors ${FOCUS_RING} ${className}`} {...(external ? NEW_TAB_PROPS : {})}>
            {children}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
        </Link>
    );
}
