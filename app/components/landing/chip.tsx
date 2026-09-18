import type { ReactNode } from "react";

const CHIP_SHAPE = "inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full";
const CHIP_SURFACE = "bg-neutral-200/70 dark:bg-neutral-800 text-muted dark:text-muted-dark";
const CHIP_HIGHLIGHT = "bg-primary-light-bg dark:bg-primary-dark-bg text-primary dark:text-primary-dark font-semibold";

export function Chip({ highlight = false, className = "", children }: {
    highlight?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <span className={`${CHIP_SHAPE} ${highlight ? CHIP_HIGHLIGHT : CHIP_SURFACE} ${className}`}>
            {children}
        </span>
    );
}
