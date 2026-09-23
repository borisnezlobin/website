const ROOT_TAG = /<svg\b[^>]*>/;

function cropRootTag(rootTag: string, pageIndex: number, pageHeight: number): string {
    const viewBox = rootTag.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    const width = viewBox?.[2] ?? 0;
    return rootTag
        .replace(/viewBox="[^"]+"/, `viewBox="0 ${pageIndex * pageHeight} ${width} ${pageHeight}"`)
        .replace(/height="[^"]+"/, `height="${pageHeight}pt"`);
}

/** typst-ts pretty-prints its SVG; glyphs are <use> paths, so whitespace between tags carries nothing. */
function compact(svg: string): string {
    return svg.replace(/>\s+</g, "><");
}

/** typst-ts stacks every page into one tall SVG; each page gets its own copy whose viewBox shows only that page. */
export function splitSvgPages(prettySvg: string, pageCount: number, pageHeight: number): string[] {
    const documentSvg = compact(prettySvg);
    if (pageCount <= 1) return [documentSvg];
    const rootTag = documentSvg.match(ROOT_TAG)?.[0];
    if (!rootTag) return [documentSvg];
    return Array.from({ length: pageCount }, (_, pageIndex) =>
        documentSvg.replace(rootTag, cropRootTag(rootTag, pageIndex, pageHeight)),
    );
}
