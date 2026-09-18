import type { WhaleBehaviorPath } from "./whale-catalog";

const BEHAVIOR_WEIGHTS: Record<string, number> = {
    cruise_loop: 6,
    turn_left: 2,
    turn_right: 2,
    rise: 1,
    dive: 1,
    roll_left: 0.8,
    roll_right: 0.8,
};

const REMEMBERED_CROSSINGS = 256;
const usedScheduleSignatures = new Set<string>();

function weightedBehavior(
    paths: Record<string, WhaleBehaviorPath>,
    height: number,
    previous: string | undefined,
) {
    const choices = Object.keys(paths).filter((behavior) => behavior in BEHAVIOR_WEIGHTS).map((behavior) => {
        let weight = BEHAVIOR_WEIGHTS[behavior];
        if (behavior === previous) {
            weight *= behavior === "cruise_loop" ? 0.4 : 0.15;
        }
        if (height < -0.1) {
            if (behavior === "rise") weight = 0;
            if (behavior === "dive") weight *= 4;
        }
        if (height > 0.1) {
            if (behavior === "dive") weight = 0;
            if (behavior === "rise") weight *= 4;
        }
        return { behavior, weight };
    });
    const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
    let draw = Math.random() * total;
    for (const choice of choices) {
        draw -= choice.weight;
        if (draw <= 0) return choice.behavior;
    }
    return choices[0].behavior;
}

function remember(signature: string) {
    if (usedScheduleSignatures.size >= REMEMBERED_CROSSINGS) {
        usedScheduleSignatures.delete(usedScheduleSignatures.values().next().value!);
    }
    usedScheduleSignatures.add(signature);
}

export function scheduleForCrossing(
    paths: Record<string, WhaleBehaviorPath>,
    crossingDistance: number,
) {
    const makeSchedule = () => {
        const schedule: string[] = [];
        let distance = 0;
        let height = 0;
        while (distance < crossingDistance || schedule.length < 4) {
            const behavior = weightedBehavior(paths, height, schedule.at(-1));
            const path = paths[behavior];
            schedule.push(behavior);
            distance += Math.max(path.cycle[0] - path.steps[0][0], 0.05);
            height += path.cycle[1] - path.steps[0][1];
        }
        return schedule;
    };

    for (let attempt = 0; attempt < 64; attempt += 1) {
        const schedule = makeSchedule();
        const signature = schedule.join("|");
        if (!usedScheduleSignatures.has(signature)) {
            remember(signature);
            return schedule;
        }
    }

    const schedule = makeSchedule();
    while (usedScheduleSignatures.has(schedule.join("|"))) schedule.push("cruise_loop");
    remember(schedule.join("|"));
    return schedule;
}
