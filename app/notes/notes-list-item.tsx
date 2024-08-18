import { Note } from "@prisma/client";
import Link from "next/link";

export const NotesListItem = ({ note }: { note: Note }) => {
  return (
        <Link href={`/notes/${note.slug}`} className="flex border border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 w-full md:w-[calc(50%-0.75rem)] hover:dark:border-neutral-400 relative group cursor-pointer flex-col p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px">
                <h2 className="text-xl flex flex-row header-link justify-start items-center">
                    {note.title}
                </h2>
                <p className="text-muted dark:text-muted-dark mb-2">
                    {note.updatedAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                    })}
                </p>
                <p className="text-ellipsis h-full w-full">{note.description}</p>
        </Link>
    );
};