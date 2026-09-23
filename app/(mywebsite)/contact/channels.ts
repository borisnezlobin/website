import { DiscordLogoIcon, EnvelopeSimpleIcon, GithubLogoIcon, LinkedinLogoIcon, XLogoIcon, type Icon } from "@phosphor-icons/react";

export type CopyAction = { kind: "copy"; label: string; value: string };
export type LinkAction = { kind: "link"; label: string; href: string };
export type ChannelAction = CopyAction | LinkAction;

export type Channel = {
    id: string;
    name: string;
    icon: Icon;
    href: string;
};

export const EMAIL_ADDRESS = "me@borisnezlobin.com";

export const EMAIL_ACTIONS: ChannelAction[] = [
    { kind: "copy", label: "Copy address", value: EMAIL_ADDRESS },
    { kind: "link", label: "Write an email", href: `mailto:${EMAIL_ADDRESS}` },
];

export const CHANNELS: Channel[] = [
    { id: "email", name: "Email", icon: EnvelopeSimpleIcon, href: `mailto:${EMAIL_ADDRESS}` },
    { id: "linkedin", name: "LinkedIn", icon: LinkedinLogoIcon, href: "https://www.linkedin.com/in/borisnezlobin" },
    { id: "github", name: "GitHub", icon: GithubLogoIcon, href: "https://github.com/borisnezlobin" },
    { id: "x", name: "X", icon: XLogoIcon, href: "https://x.com/b_nezlobin" },
    { id: "discord", name: "Discord", icon: DiscordLogoIcon, href: "https://discord.com/users/801815917969276978" },
];

export const EMAIL_STATION = 0;
