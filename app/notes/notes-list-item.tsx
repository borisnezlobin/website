import { Note } from "@prisma/client";
import Link from "next/link";

export const NotesListItem = ({ note }: { note: Note }) => {
    return (
        <Link href={`/notes/${note.slug}`}>
            <div className="p-4 py-8 hover:scale-105 w-full mt-4 border-y cursor-pointer">
                <h2 className="text-2xl font-bold">{note.title}</h2>
                <p>{note.description}</p>
            </div>
        </Link>
    );
}