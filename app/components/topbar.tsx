"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

const NAV_LINK = "link rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-light-background dark:focus-visible:ring-offset-dark-background";

const TopBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const blurBackgroundBeforeScroll = (pathname !== "/" && pathname !== "/projects" && pathname !== "/contact");
  const blurBackground = (pathname !== "/");

  useEffect(() => {
    let wasScrolled = window.scrollY > 0;
    setIsScrolled(wasScrolled);
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 0;
      if (nextScrolled === wasScrolled) return;
      wasScrolled = nextScrolled;
      setIsScrolled(nextScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`w-full fixed z-20 top-0 left-0 px-4 print:hidden h-12 transition-all duration-300
        ${blurBackground ? "backdrop-blur-md" : "bg-light-background dark:bg-dark-background"}
        ${
        !isScrolled ?
          (blurBackgroundBeforeScroll ? "bg-light-background/50 dark:bg-dark-background/20" : "bg-light-background dark:bg-dark-background")
          : (blurBackground ? "!bg-light-background/50 dark:!bg-dark-background/50" : "")
        }
      `}
      style={{ zIndex: 1000 }}
    >
        <div className="flex flex-row justify-around h-full md:justify-start md:pl-6 md:gap-24 w-full md:w-2/3 items-center">
            <Link href={"/"} className={NAV_LINK}>
                Home.
            </Link>
            <Link href={"/writing"} className={NAV_LINK}>
                Writing.
            </Link>
            <Link href={"/projects"} className={NAV_LINK}>
                Projects.
            </Link>
            <Link href={"/contact"} className={NAV_LINK}>
                Contact.
            </Link>
        </div>
    </div>
  );
};

export default TopBar;