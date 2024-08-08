import { Note } from "@prisma/client";
import Link from "next/link";

export const NotesListItem = ({ note }: { note: Note }) => {
    return (
        <div className="border-y mt-2 p-4 py-8">
            <Link href={`/notes/${note.slug}`}>
                <div className="hover:scale-105 w-full cursor-pointer">
                    <h2 className="text-2xl font-bold">{note.title}</h2>
                    <p>{note.description}</p>
                </div>
            </Link>
        </div>
    );
}