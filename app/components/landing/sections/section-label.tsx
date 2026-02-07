export function SectionLabel({ label }: { label: string }) {
    return (
        <div className="flex-shrink-0 flex items-center md:items-start md:pt-8">
            <span
                className="emph text-primary text-[2rem] tracking-[0.3em] font-bold uppercase md:[writing-mode:vertical-rl] md:rotate-180"
            >
                {label}
            </span>
        </div>
    );
}
