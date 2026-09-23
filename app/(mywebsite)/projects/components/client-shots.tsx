import Image from "next/image";
import { CLIENT_SHOTS } from "../content/client-shots";

const SHOT_SURFACE = "block overflow-hidden rounded-md bg-light-background ring-1 ring-black/10 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-8px_rgb(0_0_0/0.22),0_32px_64px_-24px_rgb(0_0_0/0.28)] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-light-background dark:bg-dark-background dark:focus-visible:ring-offset-dark-background dark:ring-white/10";

const STACK_BACK_TO_FRONT = [
    "left-0 top-0 scale-[0.94]",
    "left-[20%] top-[12%] scale-[0.97]",
    "left-[40%] top-[24%]",
];

const LIFT_ON_INTENT = "transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:z-10 hover:-translate-y-3 hover:scale-100 focus-visible:z-10 focus-visible:-translate-y-3 focus-visible:scale-100";

const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;

function DesktopStack() {
    const backToFront = [...CLIENT_SHOTS].reverse();
    return (
        <div className="relative hidden aspect-[2/1] md:block">
            {backToFront.map((shot, depth) => (
                <a
                    key={shot.key}
                    href={shot.href}
                    aria-label={`${shot.name} website`}
                    className={`absolute w-[60%] ${STACK_BACK_TO_FRONT[depth]} ${LIFT_ON_INTENT} ${SHOT_SURFACE}`}
                    {...NEW_TAB}
                >
                    <Image
                        src={shot.desktop}
                        alt={shot.desktopAlt}
                        sizes="(min-width: 1280px) 610px, (min-width: 1024px) 45vw, 55vw"
                        className="block h-auto w-full"
                    />
                </a>
            ))}
        </div>
    );
}

function PhoneRow() {
    return (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-6 pt-2 md:hidden">
            {CLIENT_SHOTS.map((shot) => (
                <li key={shot.key} className="w-[60vw] shrink-0 snap-start">
                    <a href={shot.href} aria-label={`${shot.name} website`} className={SHOT_SURFACE} {...NEW_TAB}>
                        <Image
                            src={shot.mobile}
                            alt={shot.mobileAlt}
                            sizes="60vw"
                            className="block h-auto w-full"
                        />
                    </a>
                </li>
            ))}
        </ul>
    );
}

export function ClientShots() {
    return (
        <>
            <DesktopStack />
            <PhoneRow />
        </>
    );
}
