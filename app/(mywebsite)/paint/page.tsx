import getMetadata from "@/app/lib/metadata";
import { StudioLoader } from "./_studio/StudioLoader";
import "./paint.css";

export const metadata = getMetadata({
    title: "Wet Paint",
    description: "Turn a photo into a palette-knife painting, or smear and bleed a design. It all runs in your browser.",
    subtitle: "Palette knife and wet ink, in your browser.",
});

export default function PaintPage() {
    return <StudioLoader />;
}
