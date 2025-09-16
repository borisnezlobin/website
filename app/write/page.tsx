import { Metadata } from "next";
import getMetadata from "../lib/metadata"
import WritePageComponent from "./write-component"

export const metadata: Metadata = getMetadata({
    title: "Wrisk",
    subtitle: "Don't stop writing or you lose it all.",
    description: "Set a time, give yourself a prompt, and write. No distractions and definitely no stopping. Pause for too long and you'll lose everything :)"
});

export default function WritePage() {
    return <WritePageComponent />
}