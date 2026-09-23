"use client";

import { useEffect, useRef, useState } from "react";
import {
    flukeOffset,
    frameAt,
    loadCatalog,
    strokePush,
    type WhaleBehaviorPath,
    type WhaleStyleCatalog,
    type WhaleVisualState,
} from "./whale-catalog";
import { placeAt, planCrossing, type WhaleCrossing } from "./whale-crossing";
import { planClimb } from "./whale-climb";
import { crossingPhaseSeconds } from "./whale-clock";
import { openWhaleWake, WAKE_BLEED_PIXELS } from "./whale-wake";
import {
    invertsInDark,
    isDrawnLive,
    NEGATIVE_IN_DARK,
    openInkPainter,
    type InkPainter,
} from "./ink/ink-painter";

export type WhaleRoute = "cross" | "climb";
export type WhaleClimbDirection = "up" | "down";
export type WhaleHeading = "left" | "right";

type MadWhaleProps = {
    style: string;
    route?: WhaleRoute;
    lift?: string;
    climb?: WhaleClimbDirection;
    heading?: WhaleHeading;
    entryDelaySeconds?: number;
};

const risingFrom = (climb?: WhaleClimbDirection) => (climb ? climb === "up" : undefined);

type WhaleFilm = {
    catalog: WhaleStyleCatalog;
    ink: InkPainter;
};

type WhaleStage = {
    swimmer: HTMLDivElement;
    lane: HTMLDivElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
};

function stageOf(
    swimmer: HTMLDivElement | null,
    lane: HTMLDivElement | null,
    canvas: HTMLCanvasElement | null,
): WhaleStage | null {
    const context = canvas?.getContext("2d");
    if (!swimmer || !lane || !canvas || !context) return null;
    return { swimmer, lane, canvas, context };
}

const VIEW_SLACK = 100;
const WARM_AHEAD_SECONDS = 1;
const RETRY_PAINT_MS = 16;

export function MadWhale({ style, route = "cross", lift, climb, heading, entryDelaySeconds = 0 }: MadWhaleProps) {
    const lane = useRef<HTMLDivElement>(null);
    const swimmer = useRef<HTMLDivElement>(null);
    const surface = useRef<HTMLCanvasElement>(null);
    const wakeSurface = useRef<HTMLCanvasElement>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shownState = useRef<WhaleVisualState>("calm");
    const repaintSoon = useRef<(() => void) | null>(null);

    const [near, setNear] = useState(false);
    const [film, setFilm] = useState<WhaleFilm | null>(null);
    const [activeBehavior, setActiveBehavior] = useState("");
    const [pass, setPass] = useState(0);
    const [visualState, setVisualState] = useState<WhaleVisualState>("calm");

    useEffect(() => {
        const element = lane.current;
        if (!element) return;

        const watcher = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setNear(true),
            { rootMargin: "700px" },
        );
        watcher.observe(element);
        return () => watcher.disconnect();
    }, []);

    useEffect(() => {
        if (!near || !isDrawnLive(style)) return;
        let live = true;
        const ink = openInkPainter(style, 1, 1);

        loadCatalog(style)
            .then((catalog) => {
                if (!live) return;
                setActiveBehavior(Object.keys(catalog.behaviors)[0]);
                setFilm({ catalog, ink });
            })
            .catch(() => undefined);

        return () => {
            live = false;
            ink.close();
        };
    }, [near, style]);

    useEffect(() => {
        const stage = stageOf(swimmer.current, lane.current, surface.current);
        if (!stage || !film) return;
        const { swimmer: element, lane: bounds, canvas, context } = stage;

        const stillness = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const wake = wakeSurface.current ? openWhaleWake(wakeSurface.current) : null;
        const goesLeft = heading ? heading === "left" : film.catalog.mirrored;
        let animation: Animation | null = null;
        let crossing: WhaleCrossing | null = null;
        let frameRequest = 0;
        let frameTimer = 0;
        let live = true;
        let painted = false;
        let visible = false;
        let announcedBehavior = activeBehavior;
        let frameWidth = 0;
        let swimmerTop = 0;
        let tracedStroke = "";
        let shownFrame = -1;
        let shown = "";

        const announceBehavior = (behavior: string) => {
            if (announcedBehavior === behavior) return;
            announcedBehavior = behavior;
            setActiveBehavior(behavior);
        };

        const swimSeconds = () => Number(animation?.currentTime ?? 0) / 1000;

        const openingClockMs = (totalSeconds: number) => (pass === 0
            ? crossingPhaseSeconds(totalSeconds, entryDelaySeconds) * 1000
            : 0);

        const behaviorAtClock = () => {
            if (!crossing) return null;
            const clock = Math.max(swimSeconds(), 0);
            let index = 0;
            while (index < crossing.schedule.length - 1 && clock >= crossing.boundaries[index]) {
                index += 1;
            }
            return { clock, index, behavior: crossing.schedule[index] };
        };

        const inView = () => {
            const box = canvas.getBoundingClientRect();
            return box.bottom > -VIEW_SLACK && box.top < window.innerHeight + VIEW_SLACK
                && box.right > -VIEW_SLACK && box.left < window.innerWidth + VIEW_SLACK;
        };

        const matchPixelSize = () => {
            const box = canvas.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            const width = Math.max(1, Math.round(box.width * ratio));
            const height = Math.max(1, Math.round(box.height * ratio));
            if (canvas.width === width && canvas.height === height) return;
            canvas.width = width;
            canvas.height = height;
            painted = false;
            shown = "";
        };

        const layOutPath = () => {
            const lane = bounds.getBoundingClientRect();
            frameWidth = element.offsetWidth;
            swimmerTop = element.offsetTop;
            const measured = (size: number) => Number.isFinite(size) && size > 0;
            if (!measured(lane.width) || !measured(lane.height) || !measured(frameWidth)) return;

            const resumeAt = animation ? Number(animation.currentTime) : null;
            animation?.cancel();
            matchPixelSize();
            delete canvas.dataset.whaleFrame;
            painted = false;
            shown = "";

            crossing = route === "climb"
                ? planClimb({
                    catalog: film.catalog,
                    laneWidth: lane.width,
                    laneHeight: lane.height,
                    frameWidth,
                    rising: risingFrom(climb),
                    mirrored: goesLeft,
                })
                : planCrossing({
                    catalog: film.catalog,
                    laneWidth: lane.width,
                    frameWidth,
                    mirrored: goesLeft,
                    schedule: crossing?.schedule,
                });
            if (stillness) {
                film.ink.want(crossing.schedule[0]);
                return;
            }

            animation = element.animate(crossing.frames, {
                duration: crossing.totalSeconds * 1000,
                iterations: 1,
                easing: "linear",
                fill: "both",
            });
            animation.currentTime = resumeAt ?? openingClockMs(crossing.totalSeconds);
            film.ink.want(behaviorAtClock()?.behavior ?? crossing.schedule[0]);

            const crossed = animation;
            crossed.finished
                .then(() => {
                    if (!live || animation !== crossed) return;
                    crossing = null;
                    setPass((current) => current + 1);
                })
                .catch(() => undefined);
        };

        const cancelPaint = () => {
            cancelAnimationFrame(frameRequest);
            clearTimeout(frameTimer);
            frameRequest = 0;
            frameTimer = 0;
        };

        const queuePaint = (inMs = 0) => {
            if (frameRequest || frameTimer || !live || !visible || !crossing) return;
            if (inMs <= 0) {
                frameRequest = requestAnimationFrame(paint);
                return;
            }
            frameTimer = window.setTimeout(() => {
                frameTimer = 0;
                queuePaint();
            }, inMs);
        };

        const untilNextFrame = (index: number, frame: number) => {
            if (!crossing) return 0;
            const began = index === 0 ? 0 : crossing.boundaries[index - 1];
            const path = film.catalog.behaviors[crossing.schedule[index]];
            const next = frame + 1 < path.frameOffsets.length
                ? began + path.frameOffsets[frame + 1] * path.seconds
                : crossing.boundaries[index];
            return Math.max(1, (next - swimSeconds()) * 1000 + 1);
        };

        const dueFrame = () => {
            if (!live || !crossing || !visible) return null;
            const position = behaviorAtClock();
            if (!position) return null;
            const { clock, index, behavior } = position;
            const began = index === 0 ? 0 : crossing.boundaries[index - 1];
            const path = film.catalog.behaviors[behavior];
            const frame = frameAt(path, Math.min(Math.max(clock - began, 0), path.seconds));
            return { clock, index, behavior, began, path, frame };
        };

        type DueFrame = NonNullable<ReturnType<typeof dueFrame>>;

        const warmNextClip = ({ clock, index, began, path }: DueFrame) => {
            const following = crossing?.schedule[index + 1];
            if (!following) return;
            film.ink.want(following);
            if (path.seconds - (clock - began) < WARM_AHEAD_SECONDS) film.ink.warm(following);
        };

        const traceWake = ({ behavior, clock, path }: DueFrame, drawn: number) => {
            if (!wake || !crossing) return;
            const stroke = `${behavior}/${drawn}`;
            if (stroke === tracedStroke) return;
            tracedStroke = stroke;
            const spot = placeAt(crossing, clock);
            const frameHeight = frameWidth * path.frameAspect;
            const fluke = flukeOffset(path, goesLeft, film.ink.fluke(), film.ink.bodyBox());
            wake.trace(
                spot.x + fluke.x * frameWidth,
                swimmerTop + spot.y - frameHeight / 2 + fluke.y * frameHeight + WAKE_BLEED_PIXELS,
                strokePush(path, drawn),
            );
        };

        const noteWaiting = () => {
            const waiting = film.ink.waiting();
            if (waiting) canvas.dataset.whaleWaiting = waiting;
            else delete canvas.dataset.whaleWaiting;
        };

        const noteDrawn = (drawn: number) => {
            canvas.dataset.whaleFrame = String(drawn);
            const ground = film.ink.ground();
            if (ground >= 0) canvas.dataset.whaleGround = String(ground);
        };

        const paint = () => {
            frameRequest = 0;
            const due = dueFrame();
            if (!due) return;
            const { behavior, began, frame, index } = due;
            announceBehavior(behavior);
            warmNextClip(due);

            if (painted && shown === `${behavior}/${frame}/${shownState.current}`) {
                traceWake(due, shownFrame);
                queuePaint(untilNextFrame(index, frame));
                return;
            }

            canvas.dataset.whaleWant = String(frame);
            canvas.dataset.whaleClipStart = began.toFixed(3);
            const drawn = film.ink.paint(context, behavior, frame, shownState.current);
            noteWaiting();
            if (drawn >= 0) {
                painted = true;
                shown = `${behavior}/${drawn}/${shownState.current}`;
                shownFrame = drawn;
                noteDrawn(drawn);
                traceWake(due, drawn);
            }

            if (stillness && painted) return;
            queuePaint(drawn >= 0 ? untilNextFrame(index, frame) : RETRY_PAINT_MS);
        };

        repaintSoon.current = () => {
            cancelPaint();
            queuePaint();
        };
        layOutPath();
        visible = inView();
        film.ink.setActive(visible);
        if (visible) paint();
        const visibilityObserver = new IntersectionObserver(([entry]) => {
            visible = Boolean(entry?.isIntersecting);
            film.ink.setActive(visible);
            if (visible) {
                shown = "";
                queuePaint();
            } else {
                cancelPaint();
                delete canvas.dataset.whaleFrame;
                painted = false;
                shown = "";
            }
        }, { rootMargin: `${VIEW_SLACK}px` });
        visibilityObserver.observe(canvas);
        const behaviorClock = window.setInterval(() => {
            const position = behaviorAtClock();
            if (position) announceBehavior(position.behavior);
        }, 250);
        const resizeObserver = new ResizeObserver(layOutPath);
        resizeObserver.observe(bounds);

        let density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        const followDensity = () => {
            layOutPath();
            density.removeEventListener("change", followDensity);
            density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            density.addEventListener("change", followDensity);
        };
        density.addEventListener("change", followDensity);

        return () => {
            live = false;
            repaintSoon.current = null;
            wake?.close();
            film.ink.setActive(false);
            clearInterval(behaviorClock);
            density.removeEventListener("change", followDensity);
            visibilityObserver.disconnect();
            resizeObserver.disconnect();
            cancelPaint();
            animation?.cancel();
        };
    }, [film, pass, route, climb, heading, entryDelaySeconds]);

    useEffect(() => () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }, []);

    const currentPath = film?.catalog.behaviors[activeBehavior] ?? null;
    const swimsLeftward = heading ? heading === "left" : Boolean(film?.catalog.mirrored);

    const wear = (state: WhaleVisualState) => {
        shownState.current = state;
        setVisualState(state);
        repaintSoon.current?.();
    };

    const showHover = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (style !== "breakdown" || !film || film.catalog.stateColumns < 3 || !currentPath) {
            wear("hover");
            return;
        }

        wear("intact");
        hoverTimer.current = setTimeout(() => {
            wear("hover");
            hoverTimer.current = null;
        }, currentPath.frameSeconds * 1000);
    };

    const showCalm = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
        wear("calm");
    };

    // A crossing begins and ends off the side of the page, so the lane clips
    // sideways: those two positions would otherwise widen the page and let phones
    // scroll east. Clipping one axis leaves the whale free to swim past its band.
    return (
        <div ref={lane} className="pointer-events-none absolute inset-0 overflow-x-clip">
            <canvas
                ref={wakeSurface}
                aria-hidden
                className="absolute inset-x-0 block w-full"
                style={{ top: -WAKE_BLEED_PIXELS, height: `calc(100% + ${WAKE_BLEED_PIXELS * 2}px)` }}
            />
            <div
                ref={swimmer}
                className="absolute top-1/2 left-0 w-[clamp(17rem,46%,47.5rem)]"
                style={{ transformOrigin: "50% 0", top: lift ? `calc(50% - ${lift})` : undefined }}
            >
                <div
                    className="relative -translate-y-1/2"
                    style={{
                        aspectRatio: currentPath ? `${1 / currentPath.frameAspect}` : undefined,
                        transform: swimsLeftward ? "translateY(-50%) scaleX(-1)" : undefined,
                    }}
                >
                    <canvas
                        ref={surface}
                        data-whale-style={style}
                        data-whale-route={route}
                        data-whale-heading={swimsLeftward ? "left" : "right"}
                        data-whale-behavior={activeBehavior || undefined}
                        data-visual-state={visualState}
                        className={`absolute inset-0 block h-full w-full ${invertsInDark(style) ? NEGATIVE_IN_DARK : ""}`}
                    />
                    {currentPath && (
                        <div
                            className="pointer-events-auto absolute inset-0"
                            style={{
                                clipPath: `inset(${currentPath.hitInset.map((value) => `${value}%`).join(" ")})`,
                            }}
                            onPointerEnter={showHover}
                            onPointerLeave={showCalm}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
