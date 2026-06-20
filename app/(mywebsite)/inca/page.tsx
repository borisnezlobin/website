import type { Metadata } from "next";
import trailData from "./data/trail.json";
import photoData from "./data/photos.json";
import type { Trail } from "./lib/types";
import type { PhotoManifest } from "./lib/photos";
import { buildTrek } from "./lib/trek";
import { buildFaq } from "./lib/content";
import { intComma } from "./lib/chart";
import getMetadata from "../../lib/metadata";
import { Hero } from "./components/Hero";
import { TrekProfile } from "./components/TrekProfile";
import { Methodology } from "./components/Methodology";
import { StairLab } from "./components/StairLab";
import { PhotoGallery } from "./components/PhotoGallery";
import { Faq } from "./components/Faq";

const trail = trailData as unknown as Trail;
const photos = photoData as PhotoManifest;
const trek = buildTrek(trail);

// One host everywhere (matches app/sitemap.ts and the rest of the indexed site).
const SITE = "https://www.borisnezlobin.com";
const CANONICAL = `${SITE}/inca`;
const OG_IMAGE = `${SITE}/og?title=${encodeURIComponent(
  `${intComma(trek.totals.totalStairs)} steps`,
)}&subtitle=${encodeURIComponent("Every stair on the Inca Trail, counted")}`;
const UPDATED = trail.updatedAt ?? "2026-06-20";

export async function generateMetadata(): Promise<Metadata> {
  const description = `I counted every stone step on the 4-day Classic Inca Trail: ${intComma(
    trek.totals.totalStairs,
  )} steps in total and ${intComma(
    trek.totals.minStairs,
  )} you must climb, from Km 82 to Machu Picchu — drawn on the trail's real GPS elevation profile, with a day-by-day breakdown.`;

  const base = getMetadata({
    title: "How Many Steps Are on the Inca Trail?",
    description,
    img: OG_IMAGE,
  });

  return {
    ...base,
    alternates: { canonical: CANONICAL },
    keywords: [
      "Inca Trail steps",
      "how many steps on the Inca Trail",
      "Inca Trail stairs",
      "Inca Trail elevation profile",
      "Inca Trail stairs count",
      "Dead Woman's Pass elevation",
      "Machu Picchu trek",
    ],
  };
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted dark:text-muted-dark">{kicker}</p>
      <h2 className="vectra mt-1 text-2xl font-bold text-light-foreground dark:text-dark-foreground md:text-3xl">
        {title}
      </h2>
    </div>
  );
}

export default function IncaPage() {
  const faq = buildFaq(trek);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${CANONICAL}#article`,
        headline: "How Many Steps Are on the Inca Trail?",
        description: `A hand count of every stone step on the Classic Inca Trail — ${intComma(
          trek.totals.totalStairs,
        )} in total, ${intComma(
          trek.totals.minStairs,
        )} on the minimum route — drawn on the trail's real GPS elevation profile.`,
        image: OG_IMAGE,
        author: { "@type": "Person", name: "Boris Nezlobin", url: SITE },
        publisher: { "@type": "Person", name: "Boris Nezlobin", url: SITE },
        datePublished: UPDATED,
        dateModified: UPDATED,
        mainEntityOfPage: { "@type": "WebPage", "@id": CANONICAL },
        about: ["Inca Trail", "Machu Picchu", "Hiking"],
      },
      {
        "@type": "FAQPage",
        "@id": `${CANONICAL}#faq`,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "Dataset",
        "@id": `${CANONICAL}#dataset`,
        name: "Inca Trail step count and elevation profile",
        description: `Every stone step on the 4-day Classic Inca Trail, counted by hand (${intComma(
          trek.totals.totalStairs,
        )} total), placed on a firsthand GPS track of the ${trek.totalKm.toFixed(
          0,
        )} km route sampled against 30 m topographic elevation.`,
        creator: { "@type": "Person", name: "Boris Nezlobin" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        isAccessibleForFree: true,
        url: CANONICAL,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero trek={trek} />

      <section className="mt-14">
        <SectionHeading kicker="Walk the whole trail" title="Every step, on the real mountain" />
        <p className="mb-5 max-w-2xl text-light-foreground dark:text-dark-foreground">
          This is the trail&apos;s true elevation, from a firsthand GPS track and 30-metre topo
          data. It&apos;s grey where you walk on dirt and red where the Incas built stone steps.
          Scroll to zoom in and the red resolves into the individual steps; drag to move along the
          trail.
        </p>
        <TrekProfile trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="Method" title="How I counted them" />
        <Methodology trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="Spin the stairs" title="What I counted as a step" />
        <p className="mb-6 max-w-2xl text-light-foreground dark:text-dark-foreground">
          A photo flattens a staircase; these let you walk around one. Each flight I photographed is
          paired with a 3D wireframe rebuilt from it — drag to spin, scroll to zoom. They&apos;re
          parametric reconstructions, not laser scans (you can&apos;t scan in 3D from a single
          photo), but the proportions, irregularity and step count match what&apos;s in the frame.
        </p>
        <StairLab staircases={photos.staircases} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="Field notes" title="The steps, the not-steps, and the counting" />
        <PhotoGallery
          notSteps={photos.notSteps}
          paving={photos.paving}
          counting={photos.counting}
        />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="Questions" title="The Inca Trail steps, answered" />
        <Faq items={faq} />
      </section>

      <p className="mt-16 max-w-2xl text-sm text-muted dark:text-muted-dark">
        These are one person&apos;s careful counts, not an official survey — honest about their
        doubts and easy to correct. Found a miscount or a better elevation? I&apos;d love to hear it.
      </p>
    </main>
  );
}
