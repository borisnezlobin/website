import { LinkPreviewLoop } from "../../projects/link-preview/link-preview-loop";

/** The projects page's link-preview loop, full size. `?capture` holds it still for scripts/render-link-preview.mjs. */
export default async function LinkPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const { capture } = await searchParams;
    return (
        <div className="fixed inset-0 z-[100] overflow-auto bg-light-background">
            <LinkPreviewLoop capture={capture !== undefined} />
        </div>
    );
}
