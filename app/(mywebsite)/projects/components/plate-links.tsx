import type { PlateLink } from "../content/types";
import { linkIconFor, ProjectLink } from "./project-link";

export function PlateLinks({ links }: { links: PlateLink[] }) {
    if (links.length === 0) return null;
    return (
        <ul className="mt-6 flex flex-wrap gap-x-6">
            {links.map((link) => (
                <li key={link.href}>
                    <ProjectLink href={link.href} icon={linkIconFor(link.href)}>
                        {link.label}
                    </ProjectLink>
                </li>
            ))}
        </ul>
    );
}
