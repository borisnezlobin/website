import type { ReactNode } from "react";
import { GROW_ROWS } from "../lib/motion";

type RevealProps = {
    open: boolean;
    id?: string;
    className?: string;
    children: ReactNode;
};

/** Opens to its content's natural height. Closed content is inert, so it drops out of the tab order. */
export function Reveal({ open, id, className = "", children }: RevealProps) {
    return (
        <div
            id={id}
            data-open={open}
            inert={!open}
            className={`grid grid-rows-[0fr] data-[open=true]:grid-rows-[1fr] ${GROW_ROWS} ${className}`}
        >
            <div className="min-h-0 overflow-hidden">{children}</div>
        </div>
    );
}
