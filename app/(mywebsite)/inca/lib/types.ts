// Data model for the Inca Trail step recordings.
//
// A trail is a list of days. Each day's steps live as the raw text the user
// transcribed from their notebook (the source of truth) plus the parsed items
// derived from it. Annotations (notes / sections / uncertainty) are spans laid
// over the parsed items, anchored by item id so they survive most text edits.
//
// Ported unchanged from the incastepcounter project (the recording tool) — this
// site only reads the already-parsed data, so the parser itself is not included.

export type Direction = "up" | "down";

// One stair group, e.g. "-21-8" => 21 down, 8 of them avoidable.
export interface StepGroup {
  steps: number; // magnitude, always positive
  direction: Direction;
  avoidable: number; // 0..steps, walk-aroundable stairs within this group
  ambiguous: boolean; // the ± / plusminus marker — stair may not really count
}

// A fork in the trail: you take exactly one of the alternatives.
export interface Fork {
  alternatives: StepGroup[];
  altNotes: (string | null)[]; // parallel to alternatives
  takenPath: number | null; // index of the path actually walked, if known
}

export type ItemKind =
  | "group"
  | "fork"
  | "marker"
  | "branch-open"
  | "branch-close"
  | "lane-divider";

export interface Item {
  id: string;
  kind: ItemKind;
  raw: string; // original token text, for display and re-anchoring
  group?: StepGroup; // when kind === "group"
  fork?: Fork; // when kind === "fork"
  marker?: string; // when kind === "marker" (e.g. "Control Point")
  subAmbiguous?: StepGroup[];
}

export interface Uncertainty {
  upTo: number; // numeric magnitude for error bands
  text: string; // the user's exact phrasing, e.g. "off by up to 4"
}

export interface Span {
  id: string;
  startItemId: string;
  endItemId: string;
  label?: string; // section / checkpoint name
  note?: string;
  uncertainty?: Uncertainty;
  isCheckpoint?: boolean;
  auto?: boolean; // regenerated from an inline "(note)" on each parse
}

export interface Day {
  id: string;
  name: string; // "Day One"
  rawText: string; // exactly what the user typed / transcribed
  items: Item[]; // derived from rawText by the parser
  spans: Span[];
  branchSet?: string;
  branchLabel?: string;
}

export interface Trail {
  version: number;
  updatedAt: string | null;
  days: Day[];
}
