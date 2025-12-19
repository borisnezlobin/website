import { getPhotographs } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import { Metadata } from "next";
import PhotographItem from "./photograph";

export const metadata: Metadata = getMetadata({
    title: "Photography",
    description: "My photography (the good stuff).",
});

export default async function PhotographyPage() {
    const photos = await getPhotographs();


    
    return (
        <div className="w-full flex flex-row flex-wrap justify-center items-left mt-4 print:m-0 gap-4">
            {/* <div className="w-full text-left max-w-5xl mx-auto text-3xl font-bold emph">
                My Photography
            </div>
            <div className="w-full flex flex-row flex-wrap justify-center items-left print:m-0 gap-4">
                <p className="max-w-5xl text-left">
                    All shot on an iPhone 16 Pro. These are mostly unedited and shot with default Night Mode settings, but some of the more interesting photos use custom shutter speeds/exposure/filters.
                    You can&apos;t undo liking one of the pictures.
                </p>
            </div> */}
            {/* {photos.map((photo) => <PhotographItem key={photo.id} photo={photo} />)} */}

            {/* only show the first image */}
            <div className="w-full h-screen flex flex-row flex-wrap justify-center items-left print:m-0 gap-4">
                <div className="w-full h-screen max-w-5xl mx-auto">
                    <img src={photos[3].image} alt={photos[0].title} className="h-full w-auto mx-auto" />
                </div>
            </div>
        </div>
    );
}