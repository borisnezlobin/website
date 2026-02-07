import {
    FilePyIcon,
    FileCppIcon,
    CoffeeIcon,
    GitBranchIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
    TypeScriptIcon,
    JavaScriptIcon,
    CSSIcon,
    UnityIcon,
} from "@/app/components/lucide-imports";

export function TechIconsRow() {
    return (
        <div className="w-full flex flex-col items-center gap-4 py-16 px-8 print:hidden">
            <p className="italic text-muted dark:text-muted-dark text-sm">
                A short list of things I know:
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 max-w-2xl">
                <IconWrap title="TypeScript"><TypeScriptIcon /></IconWrap>
                <IconWrap title="JavaScript"><JavaScriptIcon /></IconWrap>
                <IconWrap title="Python"><FilePyIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="C / C++"><FileCppIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="CSS"><CSSIcon /></IconWrap>
                <IconWrap title="Java"><CoffeeIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="Unity / C#"><UnityIcon /></IconWrap>
                <IconWrap title="Git"><GitBranchIcon size={24} /></IconWrap>
            </div>
        </div>
    );
}

function IconWrap({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <span
            title={title}
            className="text-muted dark:text-muted-dark hover:text-light-foreground dark:hover:text-dark-foreground transition-colors duration-200"
        >
            {children}
        </span>
    );
}
