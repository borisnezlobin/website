import { RefObject, useEffect, useState } from "react";

export function useIsVisible(ref: RefObject<HTMLElement>) {
    const [isIntersecting, setIntersecting] = useState(false);

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

    return isIntersecting;
}