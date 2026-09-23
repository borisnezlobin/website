import Link from "next/link";
import { secondaryButtonClass } from "@/app/components/button-styles";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ActionTone = "solid" | "quiet" | "subtle";

export const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-light-background dark:focus-visible:ring-offset-dark-background";

const TONE_CLASS: Record<ActionTone, string> = {
    solid: `${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0`,
    subtle: "rounded-md px-1 py-1 text-muted hover:text-light-foreground dark:text-muted-dark dark:hover:text-dark-foreground",
    quiet: "rounded-md px-1 py-1 text-light-foreground underline decoration-muted/40 underline-offset-4 hover:decoration-current dark:text-dark-foreground dark:decoration-muted-dark/40",
};

const TONE_FOCUS: Record<ActionTone, string> = { solid: "", quiet: FOCUS_RING, subtle: FOCUS_RING };

export function actionClass(tone: ActionTone, extra = "") {
    return `inline-flex items-center justify-center gap-2 whitespace-nowrap text-base ${TONE_FOCUS[tone]} ${TONE_CLASS[tone]} ${extra}`;
}

type ActionContent = { icon?: ReactNode; children: ReactNode };

function ActionLabel({ icon, children }: ActionContent) {
    return (
        <>
            {icon && <span aria-hidden="true" className="flex text-inherit">{icon}</span>}
            <span className="text-inherit">{children}</span>
        </>
    );
}

type ActionLinkProps = ActionContent & { href: string; tone?: ActionTone; className?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;

export function ActionLink({ href, tone = "quiet", className, icon, children, ...rest }: ActionLinkProps) {
    return (
        <Link href={href} className={actionClass(tone, className)} {...rest}>
            <ActionLabel icon={icon}>{children}</ActionLabel>
        </Link>
    );
}

type ActionButtonProps = ActionContent & { tone?: ActionTone } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function ActionButton({ tone = "solid", className, icon, children, ...rest }: ActionButtonProps) {
    return (
        <button className={actionClass(tone, className)} {...rest}>
            <ActionLabel icon={icon}>{children}</ActionLabel>
        </button>
    );
}
