import { HomePreviewLoop } from "@/app/components/landing/link-preview/home-preview-loop";

/** The home page's link-preview loop, full size. `?capture` holds it still for scripts/render-home-preview.mjs. */
export default async function HomePreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const { capture } = await searchParams;
    return (
        <div className="fixed inset-0 z-[100] overflow-auto bg-light-background">
            <HomePreviewLoop capture={capture !== undefined} />
        </div>
    );
}
