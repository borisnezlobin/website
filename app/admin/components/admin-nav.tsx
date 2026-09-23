"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArticleIcon, CameraIcon, FileTextIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { useAdminAuth } from "./admin-auth";
import { Button } from "./button";

type AdminSection = { href: string; label: string; icon: Icon };

const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/admin/blog", label: "Blog", icon: ArticleIcon },
  { href: "/admin/photography", label: "Photography", icon: CameraIcon },
  { href: "/admin/resume", label: "Resume", icon: FileTextIcon },
];

function isCurrentSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const LINK_BASE =
  "relative flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400";
const LINK_CURRENT = "bg-white font-semibold text-light shadow-sm dark:bg-neutral-800 dark:text-dark";
const LINK_IDLE =
  "text-muted hover:bg-neutral-200/60 hover:text-light dark:text-muted-dark dark:hover:bg-neutral-800/60 dark:hover:text-dark";

function SectionLink({ section, current }: { section: AdminSection; current: boolean }) {
  const SectionIcon = section.icon;
  return (
    <Link
      href={section.href}
      aria-current={current ? "page" : undefined}
      className={`${LINK_BASE} ${current ? LINK_CURRENT : LINK_IDLE}`}
    >
      {current && (
        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
      )}
      <SectionIcon size={18} weight={current ? "fill" : "regular"} aria-hidden />
      {section.label}
    </Link>
  );
}

export default function AdminNav() {
  const pathname = usePathname() ?? "";
  const { signOut } = useAdminAuth();

  return (
    <aside className="sticky top-0 z-10 flex shrink-0 items-center gap-2 bg-neutral-100 px-3 py-2 shadow-sm dark:bg-neutral-950 md:h-screen md:w-52 md:flex-col md:items-stretch md:px-3 md:py-5 md:shadow-none">
      <Link
        href="/"
        className="hidden px-3 pb-4 text-base font-semibold text-light hover:text-primary dark:text-dark md:block"
      >
        Boris Nezlobin
      </Link>
      <nav aria-label="Admin sections" className="flex flex-1 gap-1 overflow-x-auto md:flex-none md:flex-col">
        {ADMIN_SECTIONS.map((section) => (
          <SectionLink
            key={section.href}
            section={section}
            current={isCurrentSection(pathname, section.href)}
          />
        ))}
      </nav>
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        aria-label="Sign out"
        className="md:mt-auto md:justify-start md:px-3"
      >
        <SignOutIcon size={18} aria-hidden />
        <span className="hidden md:inline">Sign out</span>
      </Button>
    </aside>
  );
}
