/**
 * The claim fan, after the headline on me.alaramartin.com: a hand of cards turned on its side.
 * Every claim is a card pivoting about a point out to the left of "I do stuff.", each dealt the
 * same angle further round than the last, swinging out from behind it.
 */
export const LINE_EM = 1.15;
const PIVOT_EM = 10;
const FAN_DEG = 6;
const MIN_DEG = 1;
const DEG_STEP = 0.25;
/** Cards start at least this far apart, so each one's 44px tap target never covers its neighbour's. */
const MIN_TARGET_PX = 44;
/** How far past fully open the spring carries the cards when they land (zeta 0.72 overshoots by about 4%). */
export const OVERSHOOT_OPEN = 1.04;

/** `below` of the cards hang under the anchor; the rest sit above it, in reading order. */
export type Fan = { deg: number; pivot: number; below: number };
export type Room = { up: number; down: number; left: number; right: number };

const radians = (deg: number) => (deg * Math.PI) / 180;

/** A card's signed distance from the anchor: negative above it, positive below. */
export function slotOf(card: number, fan: Fan, count: number) {
    const above = count - fan.below;
    return card < above ? card - above : card - above + 1;
}

/**
 * The hand swings as one rigid piece. At open = 1 each card sits `slot` slots round; as open
 * falls the whole side turns back towards the anchor and the cards disappear behind it one at a
 * time, nearest first.
 */
export function cardDeg(slot: number, open: number, fan: Fan, count: number) {
    if (slot === 0) return 0;
    const side = slot > 0 ? fan.below : count - fan.below;
    const angle = Math.max(0, Math.abs(slot) * fan.deg - (1 - open) * side * fan.deg);
    return Math.sign(slot) * angle;
}

/**
 * How far (in em) a card of width `width` turned by `deg` reaches past the anchor's top or bottom
 * edge, past its left edge to the right, and back past that edge to the left.
 */
export function reach(width: number, deg: number, pivot: number) {
    const angle = radians(Math.abs(deg));
    const half = LINE_EM / 2;
    return {
        out: (width + pivot) * Math.sin(angle) + half * (Math.cos(angle) - 1),
        right: (width + pivot) * Math.cos(angle) - pivot + half * Math.sin(angle),
        left: pivot * (1 - Math.cos(angle)) + half * Math.sin(angle),
    };
}

function overflow(fan: Fan, widths: number[], room: Room) {
    let over = -Infinity;
    widths.forEach((width, card) => {
        const slot = slotOf(card, fan, widths.length);
        const r = reach(width, Math.abs(slot) * fan.deg, fan.pivot);
        over = Math.max(over, r.out - (slot > 0 ? room.down : room.up), r.left - room.left, r.right - room.right);
    });
    return over;
}

/** Splits of the cards between above and below, the one closest to how the room is split first. */
function splitsByShare(count: number, room: Room) {
    const share = room.down / Math.max(room.up + room.down, 1e-6);
    return Array.from({ length: count + 1 }, (_, below) => below).sort((a, b) => Math.abs(a / count - share) - Math.abs(b / count - share));
}

/**
 * The widest fan that fits the room, tightening the angle until something does. As the angle
 * tightens the pivot moves further out, keeping the cards `separation` em apart where they start.
 */
export function fitFan(widths: number[], room: Room, emPx: number): Fan {
    const separation = Math.max(LINE_EM, MIN_TARGET_PX / emPx);
    const splits = splitsByShare(widths.length, room);
    let best: Fan = { deg: FAN_DEG, pivot: PIVOT_EM, below: splits[0] };
    let bestOver = Infinity;
    for (let deg = FAN_DEG; deg >= MIN_DEG; deg -= DEG_STEP) {
        const pivot = Math.max(PIVOT_EM, separation / radians(deg));
        for (const below of splits) {
            const fan = { deg, pivot, below };
            const over = overflow(fan, widths, room);
            if (over <= 0) return fan;
            if (over < bestOver) [best, bestOver] = [fan, over];
        }
    }
    return best;
}

/** The box the cards sweep out at `open`, in em: how far it rises above the anchor, its height from the anchor's top, and its width. */
export function fanBounds(fan: Fan, widths: number[], open: number) {
    let width = Math.max(4, ...widths);
    let above = 0;
    let height = LINE_EM;
    widths.forEach((cardWidth, card) => {
        const deg = cardDeg(slotOf(card, fan, widths.length), open, fan, widths.length);
        if (deg === 0) return;
        const r = reach(cardWidth, deg, fan.pivot);
        if (deg > 0) height = Math.max(height, LINE_EM + r.out);
        else above = Math.max(above, r.out);
        width = Math.max(width, r.right);
    });
    return { width, above, height };
}

/** Below this reach a card is fully hidden; over the next stretch it fades in. */
const TUCKED_EM = 0.3;
const TUCK_FADE_EM = 0.5;

/**
 * How visible a card is as it swings out from behind the anchor. A card only a hair off the
 * anchor's line pokes the far end of its underline past the anchor's edge, so it fades over the
 * stretch instead of showing that sliver.
 */
export function tuckOpacity(width: number, deg: number, pivot: number) {
    if (deg === 0) return 0;
    const out = reach(width, deg, pivot).out;
    return Math.min(1, Math.max(0, (out - TUCKED_EM) / TUCK_FADE_EM));
}
