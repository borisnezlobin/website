"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

const TopBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const blurBackgroundBeforeScroll = (pathname !== "/" && pathname !== "/projects" && pathname !== "/contact");
  const blurBackground = (pathname !== "/");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
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
            <Link href={"/"} className={`link`}>
                Home.
            </Link>
            <Link href={"/blog"} className={`link !hidden md:!block`}>
                Writing.
            </Link>
            <Link href={"/projects"} className={`link`}>
                Projects.
            </Link>
            <Link href={"/notes"} className={`link !hidden md:!block`}>
                Notes.
            </Link>
            <Link href={"/contact"} className={`link`}>
                Contact.
            </Link>
        </div>
    </div>
  );
};

export default TopBar;