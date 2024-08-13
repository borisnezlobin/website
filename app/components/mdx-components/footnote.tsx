import { X } from "@phosphor-icons/react/dist/ssr";
import React, { ReactNode } from "react";

const Footnote = ({ id, children }: { id: string, children?: ReactNode }) => {
    return (
        <span className="relative group">
            <input type="checkbox" id={`footnote-${id}`} className="hidden peer" />
            <label
                htmlFor={`footnote-${id}`}
                className="cursor-pointer text-xl font-bold text-sky-700 link relative z-10"
            >
                *
            </label>
            <span
                className="hidden group-hover:block peer-checked:block absolute bg-light-background dark:bg-dark-background 
                border border-[#d4d4d4] dark:border-[#525252] left-1/2 -translate-x-1/2 rounded-lg shadow-md dark:shadow-none 
                px-6 py-3 top-3 w-max max-w-[90vw] md:max-w-2xl"
                style={{
                    pointerEvents: 'none',
                    zIndex: 20,
                }}
            >
                {children}
                <label
                    htmlFor={`footnote-${id}`}
                    className="w-full h-12 flex gap-2 flex-row justify-center items-center cursor-pointer text-xl font-bold text-red-600"
                    style={{ pointerEvents: 'auto' }}
                >
                    <X /> Close
                </label>
            </span>
        </span>
    );
}

export default Footnote;