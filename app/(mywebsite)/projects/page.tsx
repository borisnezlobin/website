import getMetadata from "../../lib/metadata";
import { PROJECT_CLAIMS } from "./content/claims";
import { ProjectIndex } from "./components/project-index";
import { ProjectHero } from "./components/project-hero";

export const metadata = getMetadata({
    title: "Projects.",
    subtitle: "I’ve predicted solar flares at Lockheed Martin and co-founded a spatial computing startup.",
    description: "Boris Nezlobin has predicted solar flares at Lockheed Martin and won hackathons with the apps on this page.",
});

export default function ProjectsPage() {
    return (
        <main className="w-full">
            <ProjectHero claims={PROJECT_CLAIMS} />
            <ProjectIndex claims={PROJECT_CLAIMS} />
        </main>
    );
}
