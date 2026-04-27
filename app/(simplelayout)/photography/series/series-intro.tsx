"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

type Props = {
  title: string;
  description: string;
  count: number;
};

export default function SeriesIntro({ title, description, count }: Props) {
  return (
    <section
      className="snap-start h-[100svh] w-full flex flex-col items-center justify-center px-6 text-center"
      aria-label="Series intro"
    >
      <h1
        className="!text-primary dark:!text-primary-dark"
        style={{ fontFamily: "Vectra", fontSize: "clamp(48px, 12vw, 144px)", lineHeight: 1.05, paddingTop: 8 }}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-6 max-w-2xl text-base md:text-lg text-light-foreground/80 dark:text-dark-foreground/80 leading-relaxed">
          {description}
        </p>
      )}
      <p className="mt-8 text-[11px] uppercase tracking-[0.35em] text-muted dark:text-muted-dark">
        {count} photo{count === 1 ? "" : "s"}
      </p>
      <CaretDownIcon
        size={28}
        weight="thin"
        className="absolute bottom-10 text-muted dark:text-muted-dark animate-bounce"
        aria-hidden
      />
    </section>
  );
}
