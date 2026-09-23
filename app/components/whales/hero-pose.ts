/**
 * The one pose the writing hero shows, and where the whale's body sits inside
 * the frame it is drawn in. The drawn body fills only the middle of a clip
 * frame, so anything that has to line up with the whale — the hand-drawn
 * sketch that stands in for it under the Creative filter — is placed from
 * these fractions rather than from its own hand-tuned offsets.
 *
 * `bodyWithinFrame` was measured from the painted canvas of `roll_right`
 * frame 48; re-measure it if the pose changes.
 */
export const HERO_POSE = {
    behavior: "roll_right",
    frame: 48,
    tiltDegrees: -6,
    frameAspect: 0.8568,
    bodyWithinFrame: {
        left: 0.1954,
        top: 0.3607,
        width: 0.648,
        height: 0.3062,
    },
} as const;

const body = HERO_POSE.bodyWithinFrame;

export const heroBodyStyle = {
    left: `${body.left * 100}%`,
    width: `${body.width * 100}%`,
    top: `${(body.top + body.height / 2) * 100}%`,
    transform: "translateY(-50%)",
};

export const heroFrameStyle = {
    left: "var(--whale-frame-left)",
    width: "var(--whale-frame-width)",
    aspectRatio: `${1 / HERO_POSE.frameAspect}`,
    transform: `translateY(var(--whale-frame-lift)) rotate(${HERO_POSE.tiltDegrees}deg)`,
};
