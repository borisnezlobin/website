#!/usr/bin/env node
// Turn an Obsidian "Webpage HTML Export" into a clean article body, save a local archive copy,
// and put it on the clipboard — replacing the manual VS Code cleanup entirely.
//
// Usage:
//   node scripts/publish-article.mjs                 # newest export in the export dir
//   node scripts/publish-article.mjs visyn           # newest export matching "visyn"
//   node scripts/publish-article.mjs /path/to.html   # a specific export file
//   node scripts/publish-article.mjs visyn --slug=visyn --publish
//
// Flags:
//   --slug=<slug>   override the output slug (defaults to the filename, slugified)
//   --publish       also POST the content to the live site's admin API (existing articles only)
//   --draft         when publishing, mark the article as a draft
//
// Env overrides: OBSIDIAN_EXPORT_DIR, PUBLISH_URL (default https://www.borisnezlobin.com)

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "fs";
import { join, resolve, basename, extname } from "path";
import { homedir } from "os";
import { spawnSync } from "child_process";
import { parse } from "node-html-parser";

const ROOT = resolve(import.meta.dirname, "..");
const EXPORT_DIR = process.env.OBSIDIAN_EXPORT_DIR || join(homedir(), "Downloads/bored/HTML Exports");
const PUBLISH_URL = process.env.PUBLISH_URL || "https://www.borisnezlobin.com";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
const slugFlag = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const positional = args.find((a) => !a.startsWith("--"));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1); }

// Recursively collect .html files under a directory.
function htmlFilesUnder(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) out.push(...htmlFilesUnder(p));
        else if (extname(name).toLowerCase() === ".html") out.push({ path: p, mtime: st.mtimeMs });
    }
    return out;
}

// Resolve which export file to clean.
function resolveSource() {
    if (positional && existsSync(positional) && statSync(positional).isFile()) return positional;
    if (!existsSync(EXPORT_DIR)) fail(`Export dir not found: ${EXPORT_DIR} (set OBSIDIAN_EXPORT_DIR)`);
    let files = htmlFilesUnder(EXPORT_DIR);
    if (positional) {
        const want = slugify(positional);
        files = files.filter((f) => slugify(basename(f.path, ".html")).includes(want));
        if (!files.length) fail(`No export matching "${positional}" under ${EXPORT_DIR}`);
    }
    if (!files.length) fail(`No .html exports under ${EXPORT_DIR}`);
    return files.sort((a, b) => b.mtime - a.mtime)[0].path;
}

// Extract the article body: the .markdown-preview-view holding the real content, emitted as a bare
// <div>. Everything outside it (head, body wrapper, scripts, styles) is dropped.
function extractBody(raw) {
    const root = parse(raw, { comment: false, blockTextElements: { script: false, style: false } });
    const candidates = root.querySelectorAll(".markdown-preview-view");
    let best = null, bestScore = -1;
    for (const el of candidates) {
        const score = el.querySelectorAll(".el-p, .el-h1, .el-h2, .markdown-preview-sizer").length;
        if (score > bestScore) { bestScore = score; best = el; }
    }
    if (!best) fail("No .markdown-preview-view content found — is this an Obsidian HTML export?");
    best.querySelectorAll("script, style").forEach((n) => n.remove());
    return `<div>\n${best.innerHTML.trim()}\n</div>\n`;
}

function readAdminPassword() {
    if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
    const envPath = join(ROOT, ".env");
    if (!existsSync(envPath)) return null;
    const line = readFileSync(envPath, "utf-8").split("\n").find((l) => l.startsWith("ADMIN_PASSWORD="));
    return line ? line.slice("ADMIN_PASSWORD=".length).trim().replace(/^["']|["']$/g, "") : null;
}

async function publish(slug, content) {
    const password = readAdminPassword();
    if (!password) fail("ADMIN_PASSWORD not found (in env or .env) — can't --publish.");
    const res = await fetch(`${PUBLISH_URL}/api/admin/blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ slug, content, ...(flags.has("--draft") && { isDraft: true }) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) fail(`Publish failed (${res.status}): ${body.error || "unknown error"}`);
    console.log(`✓ Published to ${PUBLISH_URL} — blob: ${body.blobUrl}`);
}

const source = resolveSource();
const slug = slugFlag || slugify(basename(source, ".html"));
const content = extractBody(readFileSync(source, "utf-8"));

const outPath = join(ROOT, "html", "blog", `${slug}.html`);
writeFileSync(outPath, content);

const pb = spawnSync("pbcopy", { input: content });
const copied = pb.status === 0;

console.log(`✓ Cleaned:  ${basename(source)}  →  ${content.length.toLocaleString()} chars`);
console.log(`✓ Archived: html/blog/${slug}.html`);
console.log(copied ? "✓ Copied to clipboard — paste into the Edit Blog page." : "• (pbcopy unavailable)");

if (flags.has("--publish")) await publish(slug, content);
else console.log(`\nRun with --publish to push straight to the live site (existing articles only).`);
