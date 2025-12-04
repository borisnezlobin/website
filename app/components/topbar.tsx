"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";

const TopBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`w-full fixed z-20 top-0 left-0 px-4 print:hidden h-12 backdrop-blur-md ${
        isScrolled ? "!bg-light-background/50 dark:!bg-dark-background/50" : "!bg-light-background/20 dark:!bg-dark-background/20"
      }`}
      style={{ zIndex: 1000 }}
    >
        <div className="flex flex-row justify-around h-full md:justify-start md:pl-6 md:gap-24 w-full md:w-2/3 items-center">
            <Link href={"/"} className="link">
                Home.
            </Link>
            <Link href={"/blog"} className="link !hidden md:!block">
                Writing.
            </Link>
            <Link href={"/projects"} className="link">
                Projects.
            </Link>
            <Link href={"/notes"} className="link !hidden md:!block">
                Notes.
            </Link>
            <Link href={"/contact"} className="link">
                Contact.
            </Link>
        </div>
    </div>
  );
};

export default TopBar;