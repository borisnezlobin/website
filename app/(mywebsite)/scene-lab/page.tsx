import Link from "next/link";
import { FOCUS_RING } from "@/app/components/action";
import { directionHref, SCENES } from "./directions";

export default function SceneLab() {
    return (
        <main className="mx-auto max-w-2xl px-4 py-16">
            <h1 className="text-4xl font-bold text-light-foreground dark:text-dark-foreground">Scene lab</h1>
            {SCENES.map((scene) => (
                <section key={scene.slug} className="mt-10">
                    <h2 className="text-2xl font-bold text-light-foreground dark:text-dark-foreground">{scene.name}</h2>
                    <ul className="mt-3 flex flex-col gap-1">
                        {scene.directions.map((direction) => (
                            <li key={direction.slug}>
                                <Link href={directionHref(scene.slug, direction.slug)} className={`rounded-md text-lg text-light-foreground underline decoration-muted/40 underline-offset-4 hover:decoration-current dark:text-dark-foreground ${FOCUS_RING}`}>
                                    {direction.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </main>
    );
}
