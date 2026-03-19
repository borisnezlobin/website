import { SVGProps, useEffect, useRef, useState } from "react";

interface ColoredSvgProps extends SVGProps<SVGSVGElement> {
    path: string;
    color: string;
    strokeWidth?: number | string;
    /** When provided, enables draw/undraw animation tied to this boolean */
    visible?: boolean;
    /** Pixels per second for constant path animation speed */
    speed?: number;
    drawDuration?: number;
    undrawDuration?: number;
}

export function InkscapeColoredSvg({
    path,
    color,
    strokeWidth,
    visible,
    speed,
    drawDuration = 1.5,
    undrawDuration = 0.8,
    ...props
}: ColoredSvgProps) {
    const [svgData, setSvgData] = useState<{ inner: string; box: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [animReady, setAnimReady] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const pathLengthsRef = useRef<number[]>([]);
    const isAnimated = visible !== undefined;

    // ── Fetch, process, and measure ──────────────────────────────────────────
    useEffect(() => {
        setAnimReady(false);

        const run = async () => {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Failed to load SVG: ${response.status}`);

                let content = await response.text();

                const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
                const extractedViewBox = viewBoxMatch?.[1] ?? "";

                content = content.replace(/stroke:#000000;/g, `stroke:${color};`);

                if (strokeWidth !== undefined) {
                    if (/stroke-width:[^;]+;/.test(content)) {
                        content = content.replace(/stroke-width:[^;]+;/g, `stroke-width:${strokeWidth};`);
                    } else {
                        content = content.replace(/(stroke:[^;]+;)/g, `$1stroke-width:${strokeWidth};`);
                    }
                }

                // Strip the outer <svg> wrapper
                const svgStart = content.indexOf("<svg");
                const svgOpenEnd = svgStart >= 0 ? content.indexOf(">", svgStart) + 1 : 0;
                const svgClose = content.lastIndexOf("</svg>");
                const innerContent =
                    svgStart >= 0 && svgClose >= 0
                        ? content.slice(svgOpenEnd, svgClose).trim()
                        : content;

                // Measure actual visual bounding box via a hidden temp SVG.
                // getBBox() on a <g> includes all descendant transforms, giving the true
                // rendered bounds. getBBox() is geometric only (excludes stroke), so we
                // expand by strokeWidth/2 on every side to prevent stroke clipping.
                const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                Object.assign(tempSvg.style, {
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    width: "2000px",
                    height: "2000px",
                    overflow: "visible",
                });
                tempSvg.innerHTML = innerContent;
                document.body.appendChild(tempSvg);

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                Array.from(tempSvg.children).forEach((el) => {
                    if (!(el instanceof SVGGraphicsElement)) return;
                    try {
                        const b = el.getBBox();
                        if (b.width === 0 && b.height === 0) return;
                        minX = Math.min(minX, b.x);
                        minY = Math.min(minY, b.y);
                        maxX = Math.max(maxX, b.x + b.width);
                        maxY = Math.max(maxY, b.y + b.height);
                    } catch (_) {}
                });

                document.body.removeChild(tempSvg);

                const sw =
                    typeof strokeWidth === "number"
                        ? strokeWidth
                        : typeof strokeWidth === "string"
                        ? parseFloat(strokeWidth) || 1
                        : 1;
                const pad = sw / 2;

                const box = isFinite(minX)
                    ? `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
                    : extractedViewBox;

                setSvgData({ inner: innerContent, box });
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        };

        run();
    }, [path, color, strokeWidth]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Inject SVG content directly via ref (NOT dangerouslySetInnerHTML) ────
    //
    // Using dangerouslySetInnerHTML causes React to re-evaluate the SVG element
    // on every parent re-render, which resets direct DOM mutations (our path
    // styles). By injecting innerHTML via a ref in a useEffect, React never
    // owns the inner content and never resets it.
    useEffect(() => {
        if (!svgRef.current || !svgData) return;

        svgRef.current.innerHTML = svgData.inner;

        if (!isAnimated) return;

        // Measure each path's real pixel length via getTotalLength(), then use
        // that as the dasharray value so one "dash" covers the entire path.
        const paths = svgRef.current.querySelectorAll<SVGPathElement>("path");
        const lengths: number[] = [];
        paths.forEach((p, i) => {
            const len = p.getTotalLength();
            lengths[i] = len;
            p.style.transition = "none";
            p.style.fill = "none";
            p.style.strokeDasharray = `${len}`;
            p.style.strokeDashoffset = visible ? "0" : `${len}`;
        });
        pathLengthsRef.current = lengths;

        // Mark ready after next paint so the initial state is registered before
        // any transition can fire.
        const raf = requestAnimationFrame(() => setAnimReady(true));
        return () => {
            cancelAnimationFrame(raf);
            setAnimReady(false);
        };
    }, [svgData]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Animate draw/undraw on visible change ─────────────────────────────────
    //
    // CSS transitions on stroke-dashoffset are interruptible: if visible changes
    // mid-animation, the transition reverses from its current computed value.
    useEffect(() => {
        if (!animReady || !svgRef.current) return;
        const paths = svgRef.current.querySelectorAll<SVGPathElement>("path");
        const lengths = pathLengthsRef.current;
        paths.forEach((p, i) => {
            const len = lengths[i] ?? p.getTotalLength();
            const dur =
                speed && speed > 0
                    ? visible
                        ? len / speed
                        : len / (speed * 2)
                    : visible
                    ? drawDuration
                    : undrawDuration;
            const easing = speed && speed > 0 ? "linear" : `ease-${visible ? "out" : "in"}`;
            p.style.transition = `stroke-dashoffset ${dur}s ${easing}`;
            p.style.strokeDashoffset = visible ? "0" : `${len}`;
        });
    }, [visible, animReady, speed, drawDuration, undrawDuration]); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) return <div className="text-red-500">{error}</div>;
    if (!svgData) return null;

    return (
        <svg
            ref={svgRef}
            viewBox={svgData.box}
            {...props}
        />
    );
}
