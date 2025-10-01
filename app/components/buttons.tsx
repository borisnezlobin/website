"use client"

import { ArrowRight, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    direction?: "left" | "right" | "none";
}

const baseClass = "rounded-lg font-semibold px-8 py-2 transition-transform duration-300 transform focus:ring-2 shadow-lg dark:shadow-primary/10 transition hover:-translate-y-0.5 active:translate-y-0.5";

const PrimaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <button {...props} className={`${props.className} ${baseClass} bg-primary dark:bg-primary-dark text-light-foreground dark:text-dark-background`}>
            {children}
        </button>
    );
};


const SecondaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <button {...props} className={`${props.className} ${baseClass} bg-transparent text-light dark:shadow-none dark:text-dark border border-muted dark:border-muted-dark`}>
            {children}
        </button>
    );
}

const LinkButton: React.FC<LinkProps> = ({ children, direction = "right", className, ...props }) => {
    if(!props["aria-label"]) props["aria-label"] = "Link to " + (props.title ? props.title : props.href);
    return (
        <Link href="/" {...props}>
            <SecondaryButton className={className}>
                {direction == "left" && <ArrowLeft className="inline-block mr-2" />}
                {children}
                {direction == "right" && <ArrowRight className="inline-block ml-2" />}
            </SecondaryButton>
        </Link>
    );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, className, ...props }) => {
    return (
        <button {...props} className={`p-2 hover:bg-light-foreground/20 dark:hover:bg-dark-foreground/20 rounded-lg bg-transparent text-light dark:text-dark ${className}`}>
            {icon}
        </button>
    );
}

export { PrimaryButton, SecondaryButton, LinkButton, IconButton };