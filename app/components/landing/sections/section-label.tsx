export function SectionLabel({ label }: { label: string }) {
    return (
        <div className="absolute top-4 right-4 md:top-0 md:right-16 items-center md:items-start">
            <span
                className="emph text-primary text-lg md:text-[2rem] tracking-[0.1em] font-bold uppercase md:[writing-mode:vertical-rl] md:[text-orientation:upright] relative inline-block bg-primary text-white px-2 py-1 md:px-4 md:py-2"
            >
                &nbsp;{label}&nbsp;
                <span className="z-10 absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[1.25rem] md:border-l-[2rem] border-l-transparent border-r-[1.25rem] md:border-r-[2rem] border-r-transparent border-b-[0.25rem] md:border-b-[2rem] border-b-light-background dark:border-b-dark-background" />
                <span className="z-10 absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[1.25rem] md:border-l-[2rem] border-l-transparent border-r-[1.25rem] md:border-r-[2rem] border-r-transparent border-t-[0.25rem] md:border-t-[1rem] border-t-light-background dark:border-t-dark-background" />
            </span>
        </div>
    );
}
