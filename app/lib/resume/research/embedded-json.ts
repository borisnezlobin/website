type ScanState = { depth: number; inString: boolean; escaped: boolean };

function advance(state: ScanState, character: string): void {
    if (state.inString) {
        state.escaped = !state.escaped && character === "\\";
        if (!state.escaped && character === '"') state.inString = false;
        return;
    }
    if (character === '"') state.inString = true;
    else if (character === "{") state.depth += 1;
    else if (character === "}") state.depth -= 1;
}

/** Reads the balanced `{...}` literal that follows `marker` in a page's inline script. */
export function readEmbeddedJson(source: string, marker: string): unknown {
    const markerIndex = source.indexOf(marker);
    const start = markerIndex === -1 ? -1 : source.indexOf("{", markerIndex);
    if (start === -1) return null;
    const state: ScanState = { depth: 0, inString: false, escaped: false };
    for (let index = start; index < source.length; index++) {
        advance(state, source[index]);
        if (state.depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
    return null;
}
