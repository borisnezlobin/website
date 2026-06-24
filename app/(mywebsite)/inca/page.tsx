import type { Metadata } from "next";
import trailData from "./data/trail.json";
import photoData from "./data/photos.json";
import type { Trail } from "./lib/types";
import type { PhotoManifest } from "./lib/photos";
import { buildTrek } from "./lib/trek";
import { buildFaq } from "./lib/content";
import { intComma } from "./lib/chart";
import { buildStairMesh } from "./lib/stairs";
import { loadModels } from "./lib/models";
import getMetadata from "../../lib/metadata";
import { Hero } from "./components/Hero";
import { TrekProfile } from "./components/TrekProfile";
import { Methodology } from "./components/Methodology";
import { StairLab, type StairItem } from "./components/StairLab";
import { PhotoGallery } from "./components/PhotoGallery";
import { Faq } from "./components/Faq";

const trail = trailData as unknown as Trail;
const photos = photoData as PhotoManifest;

// Merge hand-traced models (dropped into data/models) with the procedural
// stand-ins: each staircase shows its traced model if one exists, otherwise a
// generated placeholder — so the lab stays full and improves as you trace.
function buildStairItems(): StairItem[] {
  const byPhoto = new Map(loadModels().map((m) => [m.photo, m]));
  const items: StairItem[] = photos.staircases.map((s) => {
    const traced = byPhoto.get(s.file);
    if (traced) {
      byPhoto.delete(s.file);
      return { photo: s.file, caption: traced.caption || s.caption, mesh: traced.mesh, traced: true };
    }
    return { photo: s.file, caption: s.caption, mesh: buildStairMesh(s.spec), traced: false };
  });
  // traced models for photos not already in the staircase list
  for (const m of byPhoto.values()) {
    items.push({ photo: m.photo, caption: m.caption, mesh: m.mesh, traced: true });
  }
  return items;
}
const trek = buildTrek(trail);

// One host everywhere (matches app/sitemap.ts and the rest of the indexed site).
const SITE = "https://www.borisnezlobin.com";
const CANONICAL = `${SITE}/inca`;
const OG_IMAGE = `${SITE}/og?title=${encodeURIComponent(
  `${intComma(trek.totals.totalStairs)} steps`,
)}&subtitle=${encodeURIComponent("Every stair on the Inca Trail, counted")}`;
const UPDATED = trail.updatedAt ?? "2026-06-20";

export async function generateMetadata(): Promise<Metadata> {
  const description = `I counted every stone step on the 4-day Classic Inca Trail by hand: ${intComma(
    trek.totals.totalStairs,
  )} steps in total, ${intComma(
    trek.totals.minStairs,
  )} you must climb, from Km 82 to Machu Picchu. Each one is placed on the trail's real GPS elevation profile — likely the most detailed map of the trail's stairs anywhere.`;

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
  const stairItems = buildStairItems();

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
        <SectionHeading kicker="The whole trail at a glance" title="Where all the steps are" />
        <p className="mb-5 max-w-2xl text-light-foreground dark:text-dark-foreground">
          The Inca Trail isn&apos;t one long staircase. It&apos;s a {trek.totalKm.toFixed(0)}-kilometre
          walk over a {intComma(trek.maxElev)}-metre pass and a long stone descent to Machu Picchu,
          with the steps bunched on the steepest pitches — gentle along the river, relentless on the
          drop through Phuyupatamarca. The chart below is the real trail: true elevation from a GPS
          track and topographic data, grey where you walk on dirt and red where the Incas laid stone.
          Drag to move along it, and zoom in until the red breaks into the individual steps.
        </p>
        <TrekProfile trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="Method" title="How I counted them" />
        <Methodology trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="In three dimensions" title="What a single step looks like" />
        <p className="mb-6 max-w-2xl text-light-foreground dark:text-dark-foreground">
          No two Inca steps are alike — hand-cut from whatever stone was on the mountain, tall in one
          place, ankle-low the next, tilted almost everywhere. A photograph flattens all of that, so
          each staircase here is rebuilt as a 3D model you can spin and zoom. They&apos;re
          reconstructions from photographs rather than scans, but the proportions and the number of
          steps match the real flight.
        </p>
        <StairLab items={stairItems} />
      </section>

      <section className="mt-16">
        <SectionHeading kicker="From the trail" title="Steps, not-steps, and judgement calls" />
        <p className="mb-6 max-w-2xl text-light-foreground dark:text-dark-foreground">
          Half the work of counting is deciding what counts. These are photographs from the trek:
          the unmistakable staircases, the borderline cases — ramps, paving, a single worn slab —
          that had to be ruled in or out, and the path as it really looks underfoot.
        </p>
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
        doubts and easy to correct. If you&apos;ve walked the trail and think a stretch is miscounted,
        or you have a better elevation for a landmark, I&apos;d genuinely like to hear it.
      </p>
    </main>
  );
}
