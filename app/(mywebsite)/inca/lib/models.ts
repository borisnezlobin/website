import fs from "node:fs";
import path from "node:path";
import { finalizeMesh, type EdgeKind, type StairMesh, type Vec3 } from "./stairs";

export interface ImportedModel {
  photo: string;
  caption: string;
  mesh: StairMesh;
}

interface ModelFile {
  photo: string;
  caption?: string;
  category?: string;
  points: Vec3[];
  edges: [number, number, EdgeKind?][];
}

const MODELS_DIR = path.join(
  process.cwd(),
  "app",
  "(mywebsite)",
  "inca",
  "data",
  "models",
);

export function loadModels(): ImportedModel[] {
  let files: string[];
  try {
    files = fs
      .readdirSync(MODELS_DIR)
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .sort();
  } catch {
    return [];
  }

  const models: ImportedModel[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, file), "utf8")) as ModelFile;
      if (!Array.isArray(raw.points) || !raw.points.length) continue;
      const points = raw.points.map((p) => [p[0], p[1], p[2]] as Vec3);
      const edges = (raw.edges ?? [])
        .filter((e) => e[0] < points.length && e[1] < points.length)
        .map((e) => ({ a: e[0], b: e[1], kind: (e[2] ?? "blob") as EdgeKind }));
      models.push({
        photo: raw.photo ?? file.replace(/\.json$/, ""),
        caption: raw.caption ?? "",
        mesh: finalizeMesh(points, edges),
      });
    } catch {
      // skip malformed files rather than break the whole page
    }
  }
  return models;
}
