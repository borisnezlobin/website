"use client";

import { useEffect, useRef, useState } from "react";

/** The fan opens and closes on a spring, so it can turn around mid-swing from wherever it is. */
const STIFFNESS = 230;
/** A little overshoot as the cards land, then straight back in. */
const DAMPING_RATIO = { open: 0.72, close: 1 } as const;
const MAX_STEP_SECONDS = 1 / 30;

type SpringState = { position: number; velocity: number };

function stepSpring(state: SpringState, target: number, damping: number, dt: number) {
    const accel = -STIFFNESS * (state.position - target) - damping * state.velocity;
    state.velocity += accel * dt;
    state.position += state.velocity * dt;
    const settled = Math.abs(state.position - target) < 0.001 && Math.abs(state.velocity) < 0.01;
    if (settled) {
        state.position = target;
        state.velocity = 0;
    }
    return settled;
}

/** How open the fan is: 0 tucked away, 1 fully fanned, a little past while it overshoots. Without `animate` it jumps. */
export function useFanSpring(fanned: boolean, animate: boolean) {
    const [open, setOpen] = useState(0);
    const state = useRef<SpringState>({ position: 0, velocity: 0 });

    useEffect(() => {
        const target = fanned ? 1 : 0;
        if (!animate) {
            state.current = { position: target, velocity: 0 };
            setOpen(target);
            return;
        }
        const damping = 2 * (fanned ? DAMPING_RATIO.open : DAMPING_RATIO.close) * Math.sqrt(STIFFNESS);
        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, MAX_STEP_SECONDS);
            last = now;
            const settled = stepSpring(state.current, target, damping, dt);
            setOpen(state.current.position);
            if (!settled) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [fanned, animate]);

    return open;
}
