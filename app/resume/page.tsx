import { LinkButton } from "components/buttons";
import Link from "next/link";
import getMetadata from "../lib/metadata";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";

export const metadata = getMetadata({
    title: "Resume",
    description: "View and download my resume."
})

export default function Home() {
    return (
        <main className="flex flex-col justify-center items-start gap-4 mb-[30dvh] p-4 lg:p-0">
            <div className="flex flex-row w-full justify-between items-center mb-6 mt-12">
                <h1 className="text-3xl font-bold dark:text-dark relative text-center">
                    My Resume
                </h1>
                <LinkButton
                    href="/Resume_Boris_Nezlobin.pdf"
                    direction="none"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-row gap-3 justify-center items-center"
                >
                    <DownloadSimple weight="bold" />
                    Download
                </LinkButton>
            </div> 
            <iframe src="/Resume_Boris_Nezlobin.pdf" className="w-full h-[768px]" />
        </main>
    );
}