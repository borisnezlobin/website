import getMetadata from "@/app/lib/metadata";
import { getResumeView } from "@/app/lib/resume/store";
import { STANDARD_SLUG } from "@/app/lib/resume/types";
import { RequestPage } from "./components/request-page";

export const metadata = getMetadata({
    title: "Resume",
    description: "Tell me what you’re hiring for and get a one-page resume made for that role.",
});

export const revalidate = 3600;

async function standardSheetUrl(): Promise<string | null> {
    try {
        const standard = await getResumeView(STANDARD_SLUG);
        return standard?.pageSvgUrls[0] ?? null;
    } catch (error) {
        console.error("Could not load the standard resume preview", error);
        return null;
    }
}

export default async function ResumeIndexPage() {
    return <RequestPage standardSheetUrl={await standardSheetUrl()} />;
}
