import { FOCUS_RING } from "@/app/components/action";

/** The paper of a photo print: a warm white by day, a dimmer warm white at night so it doesn't glare. */
export const PRINT_PAPER = "bg-[#fbfaf6] dark:bg-[#d9d2c6]";

/** Round, neutral icon controls for the lightbox: a fill instead of a border, 44px to hit. */
export const ROUND_CONTROL = `inline-flex size-11 items-center justify-center rounded-full bg-light-foreground/5 text-light-foreground transition-colors hover:bg-light-foreground/10 disabled:opacity-40 dark:bg-dark-foreground/10 dark:text-dark-foreground dark:hover:bg-dark-foreground/20 ${FOCUS_RING}`;

/** A control sitting on top of a photo or video: a dark translucent disc that reads on any image. */
export const ON_MEDIA_CONTROL = `inline-flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 ${FOCUS_RING}`;

/** A hairline that keeps a photo's edge crisp on either paper, as a ring so it can follow rounded corners. */
export const MEDIA_EDGE = "ring-1 ring-black/10 dark:ring-white/10";
