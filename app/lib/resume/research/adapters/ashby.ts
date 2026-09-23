import { isRecord, readString } from "../../json";
import { readEmbeddedJson } from "../embedded-json";
import { htmlToPlainText } from "../html-text";
import { safeFetch } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

export function ashbyTarget(url: URL): true | null {
    const segments = pathSegments(url);
    return /(^|\.)ashbyhq\.com$/i.test(url.hostname) && segments.length >= 2 ? true : null;
}

// A large company's Ashby board API runs past the fetch cap, so read the posting page's embedded data.
async function readAshby(_target: true, url: string): Promise<RawPosting> {
    const page = await safeFetch(url);
    const appData = readEmbeddedJson(page.body, "window.__appData");
    const posting = isRecord(appData) && isRecord(appData.posting) ? appData.posting : null;
    if (!posting) throw new Error("Ashby page had no posting data");
    const organization = isRecord(appData) && isRecord(appData.organization) ? appData.organization : {};
    return {
        title: readString(posting, "title"),
        company: readString(organization, "name"),
        location: readString(posting, "locationName"),
        text: htmlToPlainText(readString(posting, "descriptionHtml") ?? ""),
    };
}

export const ashbyAdapter = defineAdapter({ name: "ashby", detect: ashbyTarget, read: readAshby });
