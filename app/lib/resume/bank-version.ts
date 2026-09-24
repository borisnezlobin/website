import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import bulletsJson from "./data/bullets.json";
import entriesJson from "./data/entries.json";
import { STANDARD_BULLET_IDS } from "./render/standard";

const VERSION_LENGTH = 12;
const RENDER_DIR = path.join(process.cwd(), "app", "lib", "resume", "render");
const RENDER_SUBDIRS = ["", "texture"];
const SOURCE_FILE = /\.(ts|typ)$/;

function readIfPresent(file: string): string {
    try {
        return readFileSync(file, "utf8");
    } catch {
        return "";
    }
}

function renderSourceFiles(): string[] {
    return RENDER_SUBDIRS.flatMap((subdir) => {
        const directory = path.join(RENDER_DIR, subdir);
        try {
            return readdirSync(directory)
                .filter((name) => SOURCE_FILE.test(name))
                .sort()
                .map((name) => path.join(subdir, name));
        } catch {
            return [];
        }
    });
}

/** Everything that changes what a rendered resume looks like: the template, its helpers, and the bank. */
function hashInputs(): string {
    const renderSources = renderSourceFiles().map((file) => `${file}\n${readIfPresent(path.join(RENDER_DIR, file))}`);
    const bank = [bulletsJson, entriesJson, STANDARD_BULLET_IDS].map((part) => JSON.stringify(part));
    return createHash("sha256").update([...bank, ...renderSources].join("\n")).digest("hex").slice(0, VERSION_LENGTH);
}

/**
 * Identifies the bank and renderer a saved resume was built from. Curating the bank or changing the
 * template retires every stored resume, so nobody is served one built from bullets or a layout that
 * no longer exists.
 */
export const BANK_VERSION = hashInputs();
