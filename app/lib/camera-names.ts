// EXIF Make/Model pairs are inconsistent across bodies: Sony writes the internal
// product code ("SONY" + "ILCE-6700"), Apple repeats the make in the model
// ("Apple" + "iPhone 16 Pro"). This turns them into the name a person would use,
// so photos uploaded at different times don't end up with two spellings of the
// same camera.

const MAKE_CASING: Record<string, string> = {
  sony: "Sony",
  canon: "Canon",
  nikon: "Nikon",
  fujifilm: "Fujifilm",
  panasonic: "Panasonic",
  olympus: "Olympus",
  pentax: "Pentax",
  leica: "Leica",
  hasselblad: "Hasselblad",
  sigma: "Sigma",
  ricoh: "Ricoh",
  apple: "Apple",
  google: "Google",
  dji: "DJI",
  gopro: "GoPro",
};

// Sony's Alpha bodies report as ILCE-####; the name on the box is a####.
const sonyAlpha = (model: string): string | null => {
  const m = /^ILCE-(\d{4})(M\d)?$/i.exec(model);
  if (!m) return null;
  return `a${m[1]}${m[2] ? ` ${m[2].toUpperCase()}` : ""}`;
};

const titleCaseMake = (make: string): string =>
  MAKE_CASING[make.toLowerCase()] ?? make;

export function normalizeCamera(rawMake?: string | null, rawModel?: string | null): string | undefined {
  const make = (rawMake ?? "").trim();
  const model = (rawModel ?? "").trim();
  if (!model) return make ? titleCaseMake(make) : undefined;

  // Phones are known by the model alone — "Apple iPhone 16 Pro" reads as a typo.
  if (/^(iphone|ipad|pixel)/i.test(model)) return model;

  const alpha = sonyAlpha(model);
  if (alpha) return `Sony ${alpha}`;

  const nicerMake = titleCaseMake(make);
  if (!nicerMake) return model;
  // Some bodies already include the make in the model; don't say it twice.
  if (model.toLowerCase().startsWith(nicerMake.toLowerCase())) return model;
  return `${nicerMake} ${model}`;
}

// Re-normalise a value that was already stored as a single string (existing rows,
// or a hand-typed override) by splitting the make back off the front.
export function normalizeCameraString(value?: string | null): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  const [first, ...rest] = trimmed.split(/\s+/);
  if (rest.length === 0) return normalizeCamera(null, trimmed);
  if (MAKE_CASING[first.toLowerCase()]) return normalizeCamera(first, rest.join(" "));
  return normalizeCamera(null, trimmed);
}
