export type Footnote = {
    id: string;
    label: string;
    html: string;
    refs: HTMLAnchorElement[];
    slot: HTMLDivElement;
    anchorName: string;
};

// Gasp exports `<sup class="footnote-ref"><a href="#fn-1">`; Obsidian exports the same shape with hashed ids.
const REF_SELECTOR = "sup.footnote-ref a[href^='#']";
const BACKLINK_SELECTOR = ".footnote-back, .footnote-backref";
const BLOCKS_FOLLOWED_BY_NOTE = "p, h1, h2, h3, h4, h5, h6";
const BLOCKS_HOLDING_NOTE = "li, blockquote, td, figcaption";
const SLOT_ATTRIBUTE = "data-sidenote-slot";
export const HIDDEN_ON_SCREEN_CLASS = "screen:hidden";

// Obsidian labels references "[1]"; the note's own number reads better bare.
function noteLabel(ref: HTMLAnchorElement, fallback: number): string {
    return ref.textContent?.trim().replace(/^\[(.*)\]$/, "$1") || String(fallback);
}

function noteBodyHtml(item: Element): string {
    const clone = item.cloneNode(true) as Element;
    clone.querySelectorAll(BACKLINK_SELECTOR).forEach((link) => link.remove());
    return clone.innerHTML.trim();
}

function placeAfterEarlierSlots(block: Element, slot: HTMLDivElement) {
    let last: Element = block;
    while (last.nextElementSibling?.hasAttribute(SLOT_ATTRIBUTE)) last = last.nextElementSibling;
    last.after(slot);
}

function insertSlot(ref: HTMLAnchorElement): HTMLDivElement {
    const slot = document.createElement("div");
    slot.setAttribute(SLOT_ATTRIBUTE, "");
    const followed = ref.closest(BLOCKS_FOLLOWED_BY_NOTE);
    const holder = ref.closest(BLOCKS_HOLDING_NOTE);
    if (followed) placeAfterEarlierSlots(followed, slot);
    else if (holder) holder.append(slot);
    else placeAfterEarlierSlots(ref.closest("sup") ?? ref, slot);
    return slot;
}

// A zero-height inline-block sits on the line's baseline, so its bottom edge is the baseline the note aligns to.
function insertBaselineProbe(ref: HTMLAnchorElement, anchorName: string): HTMLSpanElement {
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = `display:inline-block;width:0;height:0;anchor-name:${anchorName}`;
    (ref.closest("sup") ?? ref).before(probe);
    return probe;
}

function groupRefsByTarget(root: Element): Map<string, HTMLAnchorElement[]> {
    const groups = new Map<string, HTMLAnchorElement[]>();
    root.querySelectorAll<HTMLAnchorElement>(REF_SELECTOR).forEach((ref) => {
        const targetId = decodeURIComponent(ref.hash.slice(1));
        groups.set(targetId, [...(groups.get(targetId) ?? []), ref]);
    });
    return groups;
}

function linkRefsToNote(refs: HTMLAnchorElement[], noteId: string): () => void {
    const originalHrefs = refs.map((ref) => ref.getAttribute("href"));
    refs.forEach((ref) => {
        ref.setAttribute("href", `#${noteId}`);
        ref.setAttribute("aria-describedby", noteId);
        ref.setAttribute("aria-controls", noteId);
    });
    return () => refs.forEach((ref, i) => {
        ref.setAttribute("href", originalHrefs[i] ?? "");
        ["aria-describedby", "aria-controls", "aria-expanded"].forEach((name) => ref.removeAttribute(name));
    });
}

/** Turns an article's footnote list into sidenote slots placed beside their references. */
export function mountFootnotes(root: Element): { footnotes: Footnote[]; restore: () => void } {
    const footnotes: Footnote[] = [];
    const undo: Array<() => void> = [];

    groupRefsByTarget(root).forEach((refs, targetId) => {
        const item = root.querySelector(`section.footnotes [id="${CSS.escape(targetId)}"]`);
        if (!item) return;
        const number = footnotes.length + 1;
        const id = `sidenote-${number}`;
        const anchorName = `--sidenote-ref-${number}`;
        const probe = insertBaselineProbe(refs[0], anchorName);
        const slot = insertSlot(refs[0]);
        undo.push(() => probe.remove(), () => slot.remove(), linkRefsToNote(refs, id));
        footnotes.push({ id, label: noteLabel(refs[0], number), html: noteBodyHtml(item), refs, slot, anchorName });
    });

    const list = root.querySelector("section.footnotes");
    if (list && footnotes.length) {
        list.classList.add(HIDDEN_ON_SCREEN_CLASS);
        undo.push(() => list.classList.remove(HIDDEN_ON_SCREEN_CLASS));
    }

    return { footnotes, restore: () => undo.reverse().forEach((step) => step()) };
}
