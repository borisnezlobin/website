import {
    FilePyIcon,
    FileCppIcon,
    CoffeeIcon,
    GitBranchIcon,
    ShippingContainerIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
    TypeScriptIcon,
    JavaScriptIcon,
    CSSIcon,
    UnityIcon,
} from "@/app/components/lucide-imports";

export function TechIconsRow() {
    return (
        <div className="w-full flex justify-center py-16 print:hidden">
            <div className="flex flex-wrap justify-center items-center gap-8 max-w-2xl px-8">
                <IconWrap title="TypeScript"><TypeScriptIcon /></IconWrap>
                <IconWrap title="JavaScript"><JavaScriptIcon /></IconWrap>
                <IconWrap title="Python"><FilePyIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="C / C++"><FileCppIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="CSS"><CSSIcon /></IconWrap>
                <IconWrap title="Java"><CoffeeIcon size={24} weight="fill" /></IconWrap>
                <IconWrap title="Unity / C#"><UnityIcon /></IconWrap>
                <IconWrap title="Git"><GitBranchIcon size={24} weight="bold" /></IconWrap>
                <IconWrap title="Docker"><ShippingContainerIcon size={24} weight="bold" /></IconWrap>
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
