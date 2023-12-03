"use client"

import { ArrowRight, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    direction?: "left" | "right";
}

const baseClass = "rounded-lg font-semibold px-8 py-2 transition-all duration-300 transform focus:ring-2 shadow-lg dark:shadow-primary/10 transition hover:-translate-y-0.5 active:translate-y-0.5";

const PrimaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <button {...props} className={`${props.className} ${baseClass} bg-primary dark:bg-primary-dark text-white`}>
            {children}
        </button>
    );
};

const LinkButton: React.FC<LinkProps> = ({ children, direction = "right", ...props }) => {
    return (
        <Link href="/" {...props} className={`${props.className} ${baseClass} bg-transparent text-primary dark:text-primary-dark border border-primary dark:border-primary-dark`}>
            {direction == "left" && <ArrowLeft className="inline-block mr-2" />}
            {children}
            {direction == "right" && <ArrowRight className="inline-block ml-2" />}
        </Link>
    );
}


const SecondaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <button {...props} className={`${props.className} ${baseClass} bg-transparent text-light dark:shadow-none dark:text-dark border border-muted dark:border-muted-dark`}>
            {children}
        </button>
    );
}

export { PrimaryButton, SecondaryButton, LinkButton };