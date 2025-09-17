import { Note } from "@prisma/client";
import Link from "next/link";

export const NotesListItem = ({ note }: { note: Note }) => {
  return (
        <Link href={`/notes/${note.slug}`} className="md:border overflow-clip border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 hover:dark:border-neutral-400 relative group cursor-pointer w-full md:h-48 md:p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px">
                <h2 className="text-xl flex flex-row header-link justify-start items-center">
                    {note.title}
                </h2>
                <p className="text-muted dark:text-muted-dark mb-2">
                    {new Date(note.updatedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                    })}
                </p>
                <p className="w-full overflow-hidden text-ellipsis line-clamp-4">{note.description}</p>
        </Link>
    );
};