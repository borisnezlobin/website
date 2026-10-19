/**
 * globals.css sets `transition-property: color, …` on every div at (0,1,1) specificity, which beats a
 * single utility class, so a div's own layout transition never runs. `[&&]:` doubles the class to win
 * that back. Kept as literal strings so Tailwind can find them.
 */
export const GROW_ROWS =
    "[&&]:[transition:grid-template-rows_500ms_theme(transitionTimingFunction.settle)] motion-reduce:[&&]:[transition:none]";
