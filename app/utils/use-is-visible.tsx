import { RefObject, useEffect, useState } from "react";

export function useIsVisible(ref: RefObject<HTMLElement | null>, { trackWindowFocus = false } = {}) {
    const [isIntersecting, setIntersecting] = useState(false);
    const [isWindowActive, setWindowActive] = useState(
        typeof document !== "undefined" ? !document.hidden && document.hasFocus() : true
    );

    useEffect(() => {
        if (!trackWindowFocus) return;

        const onVisibilityChange = () => setWindowActive(!document.hidden && document.hasFocus());
        const onFocus = () => setWindowActive(!document.hidden);
        const onBlur = () => setWindowActive(false);

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, [trackWindowFocus]);

    useEffect(() => {
        if(ref == null || ref.current == null) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIntersecting(entry.isIntersecting);
        });

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [ref]);

    return isIntersecting && (trackWindowFocus ? isWindowActive : true);
}