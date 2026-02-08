"use client";

export type PrintCardPhoto = {
    title: string;
    image: string;
    slug: string;
};

const ROTATION_CLASSES = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "rotate-1", "-rotate-2"];
const OFFSET_CLASSES = ["translate-y-4", "-translate-y-2", "translate-y-6", "-translate-y-3", "translate-y-2", "-translate-y-4"];

export function getPrintTransform(index: number) {
    return {
        rotation: ROTATION_CLASSES[index % ROTATION_CLASSES.length],
        offset: OFFSET_CLASSES[index % OFFSET_CLASSES.length],
    };
}

export function PrintCard({ photo, rotation, offset, className = "" }: {
    photo: PrintCardPhoto;
    rotation?: string;
    offset?: string;
    className?: string;
}) {
    return (
        <div
            className={`${rotation ?? ""} ${offset ?? ""} group [perspective:800px] cursor-pointer ${className}`}
        >
            <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:rotate-0 group-hover:translate-y-0">
                {/* Front — the photo */}
                <div className="absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-hidden shadow-xl bg-white dark:bg-neutral-200 p-2 pb-6">
                    <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover rounded-sm"
                        loading="lazy"
                    />
                </div>

                {/* Back — the title */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-sm shadow-xl bg-white dark:bg-neutral-200 p-4 flex flex-col items-center justify-center">
                    <div className="w-full h-full border border-neutral-300 rounded-sm flex flex-col items-center justify-center gap-3 px-4">
                        <p className="vectra text-lg md:text-xl text-neutral-800 text-center leading-snug">
                            {photo.title}
                        </p>
                        <div className="w-8 h-px bg-neutral-300" />
                        <p className="text-xs text-neutral-500 emph">
                            Boris Nezlobin
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
