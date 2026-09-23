import { createHash } from "node:crypto";
import bulletsJson from "./data/bullets.json";
import entriesJson from "./data/entries.json";
import { STANDARD_BULLET_IDS } from "./render/standard";

const VERSION_LENGTH = 12;

function hashBank(): string {
    const material = [bulletsJson, entriesJson, STANDARD_BULLET_IDS].map((part) => JSON.stringify(part)).join("\n");
    return createHash("sha256").update(material).digest("hex").slice(0, VERSION_LENGTH);
}

/**
 * Identifies the bullet bank a saved resume was built from. Curating the bank changes it, which
 * retires every stored resume so nobody is served a resume built from bullets that no longer exist.
 */
export const BANK_VERSION = hashBank();
