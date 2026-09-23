import getMetadata from "../../lib/metadata";
import { ContactTuner } from "./components/contact-tuner";

export const metadata = getMetadata({
    title: "Contact Me",
    description: "Questions, comments, suggestions? Reach out to me here.",
    subtitle: "Always open!",
});

export default function ContactPage() {
    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 pb-24 pt-8 md:pt-12">
            <h1 className="vectra text-center text-5xl">Say hi.</h1>
            <ContactTuner />
        </main>
    );
}
