import { Metadata } from "next";
import CONFIG from "./config";

const BASE_METADATA: Metadata = {
    metadataBase: new URL(CONFIG.API_URL),
    title: {
        default: 'Boris Nezlobin',
        template: '%s / Boris Nezlobin',
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        shortcut: '/favicon.ico',
    },
}

const getMetadata = ({ title = "", description, info, subtitle }: {title?: string, description?: string, info?: string, subtitle?: string}) => {
    const ogUrl = `${CONFIG.API_URL}/og?title=${title || ""}&info=${info || ""}&subtitle=${subtitle || ""}`;
    return {
        title: title,
        description: description,
        openGraph: {
            title: title || 'Boris Nezlobin',
            description: description,
            siteName: 'Boris Nezlobin',
            images: [
                {
                url: ogUrl,
                width: 1920,
                height: 1080,
                },
            ],
            locale: 'en-US',
            type: 'website',
        },
        twitter: {
            title: title || 'Boris Nezlobin',
            card: 'summary_large_image',
            author: "@boris_nezlobin",
            images: [
                {
                    url: ogUrl,
                    width: 1920,
                    height: 1080,
                },
            ],
        },
    }
};

export default getMetadata;
export { BASE_METADATA };