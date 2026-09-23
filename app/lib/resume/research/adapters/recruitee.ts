import { isRecord, readString } from "../../json";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type RecruiteeTarget = { org: string; slug: string };

export function recruiteeTarget(url: URL): RecruiteeTarget | null {
    if (!/\.recruitee\.com$/i.test(url.hostname)) return null;
    const segments = pathSegments(url);
    const offerIndex = segments.indexOf("o");
    if (offerIndex === -1 || !segments[offerIndex + 1]) return null;
    return { org: url.hostname.split(".")[0], slug: segments[offerIndex + 1] };
}

async function readRecruitee({ org, slug }: RecruiteeTarget): Promise<RawPosting> {
    const data = await safeFetchJson(`https://${org}.recruitee.com/api/offers/${slug}`);
    const offer = isRecord(data) && isRecord(data.offer) ? data.offer : null;
    if (!offer) throw new Error("Recruitee returned no offer");
    const description = [readString(offer, "description"), readString(offer, "requirements")].filter(Boolean).join("\n");
    return {
        title: readString(offer, "title"),
        company: readString(offer, "company_name") ?? org.replace(/[-_]+/g, " "),
        location: readString(offer, "location"),
        text: htmlToPlainText(unescapeHtmlEntities(description)),
    };
}

export const recruiteeAdapter = defineAdapter({ name: "recruitee", detect: recruiteeTarget, read: readRecruitee });
