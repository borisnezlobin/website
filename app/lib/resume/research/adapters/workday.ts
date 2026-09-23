import { isRecord, readString } from "../../json";
import { companyFromPostingText } from "../company-name";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, withoutLocale, type RawPosting } from "./types";

const WORKDAY_HOST = /\.myworkday(site|jobs)\.com$/i;

type WorkdayTarget = { jsonUrl: string; tenant: string };

/** The public page is a redirect stub; the cxs endpoint serves the posting as JSON. */
export function workdayTarget(url: URL): WorkdayTarget | null {
    if (!WORKDAY_HOST.test(url.hostname)) return null;
    const segments = withoutLocale(pathSegments(url).filter((segment, index) => !(index === 0 && segment === "recruiting")));
    const jobIndex = segments.indexOf("job");
    if (jobIndex < 1 || jobIndex === segments.length - 1) return null;
    const tenant = jobIndex >= 2 ? segments[0] : url.hostname.split(".")[0];
    const site = segments[jobIndex - 1];
    const rest = segments.slice(jobIndex + 1).join("/");
    return { jsonUrl: `https://${url.hostname}/wday/cxs/${tenant}/${site}/job/${rest}`, tenant };
}

async function readWorkday({ jsonUrl, tenant }: WorkdayTarget): Promise<RawPosting> {
    const data = await safeFetchJson(jsonUrl);
    const info = isRecord(data) && isRecord(data.jobPostingInfo) ? data.jobPostingInfo : null;
    if (!info) throw new Error("Workday returned no jobPostingInfo");
    const title = readString(info, "title");
    const text = htmlToPlainText(unescapeHtmlEntities(readString(info, "jobDescription") ?? ""));
    const organization = isRecord(data) && isRecord(data.hiringOrganization) ? readString(data.hiringOrganization, "name") : null;
    return {
        title,
        company: companyFromPostingText(text, title ?? "", [tenant, organization ?? ""]),
        location: readString(info, "location"),
        text: [organization ? `Hiring organization: ${organization}` : "", text].filter(Boolean).join("\n"),
    };
}

export const workdayAdapter = defineAdapter({ name: "workday", detect: workdayTarget, read: readWorkday });
