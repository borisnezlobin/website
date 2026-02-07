export function SectionLabel({ label }: { label: string }) {
    return (
        <div className="absolute top-0 right-16 items-center md:items-start">
            <span
                className="emph text-primary text-[2rem] tracking-[0.1em] font-bold uppercase [writing-mode:vertical-rl;] [text-orientation:upright;] relative inline-block bg-primary text-white px-4 py-2"
            >
                &nbsp;{label}&nbsp;
                <span className="z-10 absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[2rem] border-l-transparent border-r-[2rem] border-r-transparent border-b-[2rem] border-b-light-background dark:border-b-dark-background" />
                <span className="z-10 absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[2rem] border-l-transparent border-r-[2rem] border-r-transparent border-t-[1rem] border-t-light-background dark:border-t-dark-background" />
            </span>
        </div>
    );
}
