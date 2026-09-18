import type { ReactNode } from "react";
import { MadWhale, type WhaleClimbDirection, type WhaleHeading } from "./mad-whale";

type WhaleBandProps = {
    style: string;
    heading?: WhaleHeading;
    lift?: string;
    entryDelaySeconds?: number;
};

export function WhaleBand({ style, heading, lift, entryDelaySeconds }: WhaleBandProps) {
    return (
        <div className="relative z-10 w-full h-24 sm:h-28 print:hidden">
            <MadWhale style={style} heading={heading} lift={lift} entryDelaySeconds={entryDelaySeconds} />
        </div>
    );
}

type WhaleClimbProps = {
    style: string;
    direction?: WhaleClimbDirection;
    heading?: WhaleHeading;
    entryDelaySeconds?: number;
    children: ReactNode;
};

export function WhaleClimb({ style, direction, heading, entryDelaySeconds, children }: WhaleClimbProps) {
    return (
        <div className="relative z-10 w-full">
            <MadWhale style={style} route="climb" climb={direction} heading={heading} entryDelaySeconds={entryDelaySeconds} />
            {children}
        </div>
    );
}
