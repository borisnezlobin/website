import type { StaticImageData } from "next/image";
import jyvDesktop from "@/public/projects/jyv-desktop.webp";
import jyvMobile from "@/public/projects/jyv-mobile.webp";
import pasaDesktop from "@/public/projects/pasa-desktop.webp";
import pasaMobile from "@/public/projects/pasa-mobile.webp";
import gstudioDesktop from "@/public/projects/gstudio-desktop.webp";
import gstudioMobile from "@/public/projects/gstudio-mobile.webp";

export type ClientShot = {
    key: string;
    name: string;
    href: string;
    desktop: StaticImageData;
    desktopAlt: string;
    mobile: StaticImageData;
    mobileAlt: string;
};

export const CLIENT_SHOTS: ClientShot[] = [
    {
        key: "jyv",
        name: "The Journal For Youth Voice",
        href: "https://thejyv.com",
        desktop: jyvDesktop,
        desktopAlt: "The Journal For Youth Voice homepage with its lead article, three more headlines, and a row of recent pieces",
        mobile: jyvMobile,
        mobileAlt: "The Journal For Youth Voice homepage on a phone, led by its featured article",
    },
    {
        key: "pasa",
        name: "Palo Alto Stanford Aquatics",
        href: "https://pasa-rinconada.org",
        desktop: pasaDesktop,
        desktopAlt: "The PASA Rinconada homepage with a swimmer mid-stroke above buttons to find a program or schedule a tryout",
        mobile: pasaMobile,
        mobileAlt: "The PASA Rinconada homepage on a phone, with a swimmer photo and a tryout button",
    },
    {
        key: "gstudio",
        name: "G Studio Productions",
        href: "https://g.studio",
        desktop: gstudioDesktop,
        desktopAlt: "The G Studio homepage, where the logo sits on video stills cut into angular polygon tiles",
        mobile: gstudioMobile,
        mobileAlt: "The G Studio homepage on a phone, with the logo over polygon-cut video tiles",
    },
];
