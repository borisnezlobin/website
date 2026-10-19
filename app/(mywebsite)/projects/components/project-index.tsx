"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PROJECT_MEDIA } from "../content/media";
import type { ProjectClaim } from "../content/types";
import { bridgeTab } from "../lib/carousel-focus";
import { useAimGuard } from "../lib/use-aim-guard";
import { useMediaQuery } from "../lib/use-media-query";
import { useOpenEntry } from "../lib/use-open-entry";
import { usePointedEntry } from "../lib/use-pointed-entry";
import { useReducedMotion } from "../lib/use-reduced-motion";
import { SPOTLIGHT_MEDIA } from "../spotlight-media";
import { IndexRow, type RowHandlers } from "./index-row";
import { IndexSection } from "./index-section";
import { SpotlightPanel, type PanelHold } from "./spotlight-panel";

type Pointed = ReturnType<typeof usePointedEntry>;

/**
 * The row the spotlight is on. With the panel, it follows the pointer, stays on the last row pointed at
 * (ahead of the open one, so a closed row's gallery can be explored), and holds while the reader is inside
 * the panel; without it, it is the open row.
 */
function markedEntryId(spotlight: boolean, pointed: Pointed, openId: string | null) {
    if (!spotlight) return pointed.focusId ?? openId;
    return pointed.heldId ?? pointed.hoverId ?? pointed.focusId ?? pointed.lastId ?? openId;
}

/** Every project, grouped under the hero's claims, with the spotlight beside the list where there is a pointer and room. */
export function ProjectIndex({ claims }: { claims: ProjectClaim[] }) {
    const entries = useMemo(() => claims.flatMap((claim) => claim.entries), [claims]);
    const [ids] = useState(() => entries.map((entry) => entry.id));
    const { openId, toggle } = useOpenEntry(ids);
    const pointed = usePointedEntry();
    const spotlight = useMediaQuery(SPOTLIGHT_MEDIA);
    const still = useReducedMotion();
    const panelRef = useRef<HTMLElement>(null);
    const aim = useAimGuard(panelRef, pointed.handlers.point, spotlight);
    const handlers = useMemo<RowHandlers>(
        () => ({
            ...pointed.handlers,
            point: aim.enterRow,
            leave: () => {
                aim.cancel();
                pointed.handlers.leave();
            },
            toggle,
        }),
        [aim, pointed.handlers, toggle],
    );

    const markedId = markedEntryId(spotlight, pointed, openId);
    const spotlit = entries.find((entry) => entry.id === markedId) ?? entries[0];
    const panelHold: PanelHold = {
        hold: () => {
            aim.cancel();
            pointed.handlers.hold(spotlit.id);
        },
        release: pointed.handlers.release,
    };
    const bridged = spotlight && openId !== null && (PROJECT_MEDIA[openId]?.length ?? 0) > 0;
    const showOpenEntry = () => {
        if (!openId || spotlit.id === openId) return false;
        pointed.handlers.hold(openId);
        return true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
        if (bridged) bridgeTab(event, document.getElementById(openId), panelRef.current, showOpenEntry);
    };

    return (
        <div className="px-4 pb-32 pt-12 md:px-8 md:pt-20">
            <div onKeyDown={onKeyDown} className="max-w-7xl spotlight:grid spotlight:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] spotlight:gap-x-16">
                <div onPointerMove={aim.track} onPointerLeave={handlers.leave}>
                    {claims.map((claim) => (
                        <IndexSection key={claim.id} claim={claim}>
                            {claim.entries.map((entry) => (
                                <IndexRow key={entry.id} entry={entry} open={entry.id === openId} marked={entry.id === markedId} spotlight={spotlight} still={still} handlers={handlers} />
                            ))}
                        </IndexSection>
                    ))}
                </div>
                {spotlight && (
                    <SpotlightPanel
                        panelRef={panelRef}
                        entry={spotlit}
                        openId={openId}
                        rowPointed={pointed.hoverId !== null || pointed.focusId !== null}
                        held={pointed.heldId !== null}
                        still={still}
                        onHold={panelHold}
                    />
                )}
            </div>
        </div>
    );
}
