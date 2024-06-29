import { LinkButton } from "components/buttons";
import Link from "next/link";
import getMetadata from "../lib/metadata";

export const metadata = getMetadata({
    title: "Resume",
    description: "View and download my resume."
})

export default function Home() {
    return (
        <main className="flex flex-col justify-center items-start mt-[3rem] gap-4 mb-[30dvh] p-4 lg:p-0">
            <div className="w-full fixed z-10 top-0 left-0 p-4">
                <div className="flex flex-row justify-around w-full sm:w-1/2 items-center">
                    <Link href={"/blog"} className="link">Blog.</Link>
                    <Link href={"/projects"} className="link">Projects.</Link>
                    <Link href={"/contact"} className="link">Contact.</Link>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center mb-6 mt-12">
                <h1 className="text-3xl font-bold dark:text-dark relative text-center">
                    Resume
                </h1>
                <LinkButton
                    href="/Resume_Boris_Nezlobin.pdf"
                    direction="none"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download
                </LinkButton>
            </div> 
            <iframe src="/Resume_Boris_Nezlobin.pdf" className="w-full h-[768px]" />
        </main>
    );
}