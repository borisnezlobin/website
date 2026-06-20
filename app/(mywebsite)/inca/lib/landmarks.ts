// Classifying the markers Boris jotted along the trail (ruins, passes, camps,
// bridges, control points…) into a small set of kinds the chart can style and
// decide which ones deserve a printed label vs. a quiet dot.

export type LandmarkKind =
  | "start" // trailhead
  | "camp" // overnight camp / day boundary
  | "ruin" // a named Inca site
  | "pass" // a high pass (Dead Woman's, etc.)
  | "control" // checkpoint / control point
  | "water" // bridge, river, stream, lake
  | "viewpoint" // mirador / viewpoint
  | "waypoint"; // anything else (rest stops, % markers, times…)

// The kinds prominent enough to earn a printed label on the chart.
const MAJOR_KINDS: ReadonlySet<LandmarkKind> = new Set<LandmarkKind>([
  "start",
  "camp",
  "ruin",
  "pass",
]);

export function isMajorKind(kind: LandmarkKind): boolean {
  return MAJOR_KINDS.has(kind);
}

// First matching rule wins, so order matters (a "pass" mention beats "ruin").
const RULES: { test: RegExp; kind: LandmarkKind }[] = [
  { test: /dead\s*woman|warmi|\bpass\b|^peak$|abra/i, kind: "pass" },
  { test: /control\s*point|checkpoint/i, kind: "control" },
  {
    test: /ruin|sayac|sayaq|runku|runqu|phuyu|wi[ñn]ay|winay|intipata|inti\s*p[uy]|sun\s*gate|machu|chaki|chaqu|temple|terrace|pachamama|ritual|plaza/i,
    kind: "ruin",
  },
  { test: /camp/i, kind: "camp" },
  { test: /bridge|river|stream|lake|water|crossing/i, kind: "water" },
  { test: /mirador|viewpoint|view\b/i, kind: "viewpoint" },
];

export function classifyMarker(label: string): LandmarkKind {
  for (const rule of RULES) if (rule.test.test(label)) return rule.kind;
  return "waypoint";
}

// Field spellings → the names a reader (and a search engine) expects. Applied
// as substring fixes so surrounding phrasing ("Sign for …") survives.
const CANONICAL: { test: RegExp; name: string }[] = [
  { test: /runq?ur?a?kay|runku?ra?kay/i, name: "Runkurakay" },
  { test: /saya[oc]ya?marca|sayacmarca/i, name: "Sayacmarca" },
  { test: /chaki?q?ocha|chaquicocha/i, name: "Chaquicocha" },
  { test: /phuyupatamar[kc]a/i, name: "Phuyupatamarca" },
  { test: /inti\s*p[uy][nk]?[ku]?u?|intipuku/i, name: "Sun Gate" },
  { test: /wi[ñn]ay\s*wayna|wi[ñn]ay/i, name: "Wiñay Wayna" },
];

function canonicalize(s: string): string {
  for (const c of CANONICAL) if (c.test.test(s)) return s.replace(c.test, c.name);
  return s;
}

// Tidy a raw marker into something presentable: drop bare timestamps and the
// "NN% done" progress notes (useful as data, noisy as labels), trim trailing
// punctuation, fix field spellings. Returns null when nothing meaningful is left.
export function cleanLabel(raw: string): string | null {
  let s = raw.trim().replace(/[.,;:]+$/, "").trim();
  if (!s) return null;
  // Pure time stamps ("3:15pm", "7:55am") aren't place names.
  if (/^\(?\d{1,2}:\d{2}\s*(am|pm)?\)?$/i.test(s)) return null;
  // "44% done", "76% done 9:21am)" — progress notes, not landmarks.
  if (/^\d{1,3}\s*%\s*done/i.test(s)) return null;
  // Strip a trailing parenthetical time, e.g. "Camp (9:21am)".
  s = s.replace(/\s*\(?\d{1,2}:\d{2}\s*(am|pm)?\)?\s*$/i, "").trim();
  return s ? canonicalize(s) : null;
}
