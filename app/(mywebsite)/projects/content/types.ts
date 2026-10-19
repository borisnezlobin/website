export type ProjectLinkSpec = { label: string; href: string };

export type ProjectEntry = {
    /** Doubles as the page anchor, so /projects#enf keeps working from the landing page. */
    id: string;
    name: string;
    /** One line, leading with the impact. It is the row's main line, with the name under it. */
    tagline: string;
    /** The project's own page. It is listed first under the paragraph. */
    href?: string;
    /** One paragraph, shown when the row is opened, and in the spotlight when the entry has no media. */
    body: string;
    /** Secondary links, listed after `href`. */
    links?: ProjectLinkSpec[];
    /** Marks an entry that won something; it carries the award mark. */
    won?: true;
};

/** A first-person statement from the hero, and the heading over its group of projects. */
export type ProjectClaim = {
    id: string;
    verb: string;
    noun: string;
    entries: ProjectEntry[];
};
