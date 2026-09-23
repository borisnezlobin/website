import { isRecord, readString } from "../../json";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type SmartRecruitersTarget = { company: string; postingId: string };

export function smartRecruitersTarget(url: URL): SmartRecruitersTarget | null {
    if (!/(^|\.)smartrecruiters\.com$/i.test(url.hostname)) return null;
    const segments = pathSegments(url);
    const id = segments.find((segment) => /^\d{6,}/.test(segment));
    if (!id || segments.length < 2) return null;
    return { company: segments[0], postingId: id.split("-")[0] };
}

function sectionsText(value: unknown): string {
    if (!isRecord(value)) return "";
    return Object.values(value)
        .filter(isRecord)
        .map((section) => `${readString(section, "title") ?? ""}\n${htmlToPlainText(unescapeHtmlEntities(readString(section, "text") ?? ""))}`)
        .join("\n");
}

async function readSmartRecruiters({ company, postingId }: SmartRecruitersTarget): Promise<RawPosting> {
    const data = await safeFetchJson(`https://api.smartrecruiters.com/v1/companies/${company}/postings/${postingId}`);
    if (!isRecord(data)) throw new Error("SmartRecruiters returned no posting");
    const location = isRecord(data.location) ? [readString(data.location, "city"), readString(data.location, "country")].filter(Boolean).join(", ") : null;
    const ad = isRecord(data.jobAd) ? data.jobAd : {};
    return {
        title: readString(data, "name"),
        company: isRecord(data.company) ? readString(data.company, "name") : company,
        location: location || null,
        text: sectionsText(isRecord(ad.sections) ? ad.sections : null),
    };
}

export const smartRecruitersAdapter = defineAdapter({
    name: "smartrecruiters",
    detect: smartRecruitersTarget,
    read: readSmartRecruiters,
});
