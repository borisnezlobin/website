import { ReactNode } from "react";

const Footnote = ({ id, children }: { id: string, children?: ReactNode }) => {
    return (
        <span className="group relative z-20">
            <span className="text-sm top-[-0.5rem] relative font-semibold text-sky-700 cursor-pointer link">[{id}]</span>
            <span className="hidden group-hover:block absolute bg-light-background dark:bg-dark-background border border-[#d4d4d4] dark:border-[#525252] left-1/2 -translate-x-1/2 rounded-lg shadow-md dark:shadow-none px-6 py-3 top-3 w-max max-w-2xl">
                {children}
            </span>
        </span>
    );
}

export default Footnote;