import { useEffect, useRef, type MutableRefObject } from "react";
import { prefersReducedMotion } from "./reduced-motion";
import { stepSpring, type Spring } from "./tuning-spring";

const LONGEST_STEP_SECONDS = 0.05;

export function useTuneTo(positionRef: MutableRefObject<number>, station: number) {
    const spring = useRef<Spring>({ position: positionRef.current, velocity: 0, target: station });

    useEffect(() => {
        if (prefersReducedMotion()) {
            positionRef.current = station;
            return;
        }
        spring.current.target = station;
        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
            const settled = stepSpring(spring.current, Math.min(LONGEST_STEP_SECONDS, (now - last) / 1000));
            last = now;
            positionRef.current = settled ? station : spring.current.position;
            if (settled) spring.current = { position: station, velocity: 0, target: station };
            else frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [positionRef, station]);
}
