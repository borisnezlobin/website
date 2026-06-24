# Hand-traced staircase models

Drop a `*.json` file in this folder and it shows up automatically in the **"Spin
the stairs"** section of `/inca`, paired with its photo. No code changes needed.

Make these files with the offline tracer:
**`incastepcounter/public/stair-tracer.html`** — open it in a browser (works
fully offline, no server needed), trace a photo, and hit **“Export for website.”**

## File format

```jsonc
{
  "photo": "IMG_6619",          // matches /public/inca/photos/IMG_6619.webp
  "caption": "A clean built flight …",
  "category": "staircase",      // informational
  "points": [[x, y, z], ...],   // world coords; the viewer auto-centres & frames
  "edges": [[i, j, "blob"], ...] // index pairs; kind sets the colour
}
```

Edge `kind` values: `nose` / `edge` are drawn as bright accent lines; `blob`,
`tread`, `riser`, `rung` are structural. Unknown kinds default to `blob`.

## Notes

- Files starting with `_` are ignored (handy for stashing drafts).
- Models merge with the procedural stand-ins by `photo`: a staircase shows your
  traced model if one exists here, otherwise a generated placeholder. So you can
  replace them one at a time. The `example-*.json` is a demo — delete it once
  you've traced your own.
- Re-categorising photos (e.g. "this isn't really a staircase") is done in
  `../photos.json`, not here.
