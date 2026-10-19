export type SpacePalette = { paper: string; ink: string; red: string; mid: string; dark: boolean };

const DAY: SpacePalette = { paper: "#f5f5f5", ink: "#2b2826", red: "#CC2A26", mid: "#8d8883", dark: false };
const NIGHT: SpacePalette = { paper: "#1a1714", ink: "#d0ccc6", red: "#E96457", mid: "#6e6862", dark: true };

export const isDarkTheme = () => document.documentElement.classList.contains("dark");

export const brandPalette = (dark: boolean): SpacePalette => (dark ? NIGHT : DAY);

/** Calls back whenever next-themes flips the `dark` class on <html>; returns the unsubscribe. */
export function watchTheme(onChange: (dark: boolean) => void): () => void {
    let last = isDarkTheme();
    const observer = new MutationObserver(() => {
        const dark = isDarkTheme();
        if (dark === last) return;
        last = dark;
        onChange(dark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}
