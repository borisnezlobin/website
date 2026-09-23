"use client";

import { useRef, useState } from "react";
import { EMAIL_STATION } from "../channels";
import { useTuneTo } from "../lib/use-tune-to";
import { ChannelLinks } from "./channel-links";
import { EmailReadout } from "./email-readout";
import { LocalTime } from "./local-time";
import { TunerDisplay } from "./tuner-display";

export function ContactTuner() {
    const positionRef = useRef(EMAIL_STATION);
    const [station, setStation] = useState(EMAIL_STATION);
    const showEmail = () => setStation(EMAIL_STATION);
    useTuneTo(positionRef, station);

    return (
        <div className="flex w-full flex-col items-center">
            <TunerDisplay positionRef={positionRef} station={station} />
            <div className="mt-2 flex w-full flex-col items-center gap-8">
                <EmailReadout onPreview={showEmail} />
                <ChannelLinks onPreview={setStation} onLeave={showEmail} />
                <LocalTime />
            </div>
        </div>
    );
}
