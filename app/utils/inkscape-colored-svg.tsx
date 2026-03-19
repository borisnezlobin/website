import { SVGProps, useEffect, useState } from "react";

interface ColoredSvgProps extends SVGProps<SVGSVGElement> {
    path: string;
    color: string;
    strokeWidth?: number | string;
}

export function InkscapeColoredSvg({
    path,
    color,
    strokeWidth,
    ...props
}: ColoredSvgProps) {
    const [svgInner, setSvgInner] = useState<string>("");
    const [viewBox, setViewBox] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndProcessSvg = async () => {
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

                const svgStart = content.indexOf("<svg");
                const svgOpenEnd = svgStart >= 0 ? content.indexOf(">", svgStart) + 1 : 0;
                const svgClose = content.lastIndexOf("</svg>");
                const innerContent =
                    svgStart >= 0 && svgClose >= 0
                        ? content.slice(svgOpenEnd, svgClose).trim()
                        : content;

                setSvgInner(innerContent);
                setViewBox(extractedViewBox);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        };

        fetchAndProcessSvg();
    }, [path, color, strokeWidth]);

    if (error) return <div className="text-red-500">{error}</div>;
    if (!svgInner) return null;

    return (
        <svg
            viewBox={viewBox || undefined}
            dangerouslySetInnerHTML={{ __html: svgInner }}
            {...props}
        />
    );
}
