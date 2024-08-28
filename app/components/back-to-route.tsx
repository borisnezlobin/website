import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { HTMLProps } from "react";

type LinkProps = HTMLProps<HTMLAnchorElement> & { text: string; href: string; };

const BackToRouteLink = (props: LinkProps) => {
    return (
        <Link className={`link ${props.className && props.className} print:!hidden`} {...props} title={props.title ?? props.text}>
            <ArrowLeft /> {props.text}
        </Link>
    );
}

export default BackToRouteLink;