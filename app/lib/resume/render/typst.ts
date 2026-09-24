import fs from "node:fs";
import path from "node:path";
import { NodeCompiler, type NodeTypstCompileResult, type NodeTypstDocument } from "@myriaddreamin/typst-ts-node-compiler";
import { PAGE, usablePageHeight } from "./typesetting";
import type { ResumeSelection } from "./selection";
import { splitSvgPages } from "./svg-pages";
import { awardMarkSvg } from "./award-mark";

export const RENDER_DIR = path.join(process.cwd(), "app", "lib", "resume", "render");

const TEMPLATE_PATH = path.join(RENDER_DIR, "resume.typ");
const FONT_FILES = ["charter_regular.ttf", "charter_bold.ttf", "charter_italic.ttf", "charter_bold_italic.ttf"];
const CACHE_MAX_AGE = 10;

export type Measurement = { page: number; fill: number; document: NodeTypstDocument };

type EndMarker = { page: number; y: number };

let compiler: NodeCompiler | null = null;
let template: string | null = null;

function loadCompiler(): NodeCompiler {
    if (compiler) return compiler;
    const fontBlobs = FONT_FILES.map((file) => fs.readFileSync(path.join(RENDER_DIR, "fonts", file)));
    compiler = NodeCompiler.create({ workspace: RENDER_DIR, fontArgs: [{ fontBlobs }] });
    return compiler;
}

function loadTemplate(): string {
    template ??= fs.readFileSync(TEMPLATE_PATH, "utf8");
    return template;
}

function describeFailure(typst: NodeCompiler, result: NodeTypstCompileResult): string {
    const error = result.takeError() ?? result.takeDiagnostics();
    if (!error) return "no diagnostics";
    const diagnostics = typst.fetchDiagnostics(error) as { message?: string }[];
    return diagnostics.map((diagnostic) => diagnostic.message ?? JSON.stringify(diagnostic)).join("; ");
}

function lastEndMarker(typst: NodeCompiler, document: NodeTypstDocument): EndMarker {
    const markers = typst.query(document, { selector: "<end>", field: "value" }) as EndMarker[];
    const marker = markers.at(-1);
    if (!marker) throw new Error("resume template produced no <end> marker");
    return marker;
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

export function compileSelection(selection: ResumeSelection, texture: string): Measurement {
    const typst = loadCompiler();
    const result = typst.compile({
        mainFileContent: loadTemplate(),
        inputs: { selection: JSON.stringify(selection), texture, awardMark: awardMarkSvg() },
    });
    const document = result.result;
    if (!document) throw new Error(`resume failed to compile: ${describeFailure(typst, result)}`);
    const marker = lastEndMarker(typst, document);
    return { page: marker.page, fill: round((marker.y - PAGE.marginY) / usablePageHeight()), document };
}

export function exportDocument(document: NodeTypstDocument): { pdf: Uint8Array; pageSvgs: string[] } {
    const typst = loadCompiler();
    const pdf = new Uint8Array(typst.pdf(document, { creationTimestamp: Math.floor(Date.now() / 1000) }));
    const pageSvgs = splitSvgPages(typst.plainSvg(document), document.numOfPages, PAGE.heightPt);
    return { pdf, pageSvgs };
}

export function releaseCompileCache(): void {
    compiler?.evictCache(CACHE_MAX_AGE);
}
