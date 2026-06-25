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
import { DayBreakdown } from "./components/DayBreakdown";
import { AmbiguousBreakdown } from "./components/AmbiguousBreakdown";
import { Faq } from "./components/Faq";
import Link from "next/link";
import Image from "next/image";

const trail = trailData as unknown as Trail;
const photos = photoData as PhotoManifest;

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
  for (const m of byPhoto.values()) {
    items.push({ photo: m.photo, caption: m.caption, mesh: m.mesh, traced: true });
  }
  return items;
}
const trek = buildTrek(trail);

const SITE = "https://www.borisnezlobin.com";
const CANONICAL = `${SITE}/inca`;
const OG_IMAGE = `${SITE}/og?title=${encodeURIComponent(
  `${intComma(trek.totals.totalStairs)} steps`,
)}&subtitle=${encodeURIComponent("Every stair on the Inca Trail, counted")}`;
const UPDATED = trail.updatedAt ?? "2026-06-25";

export async function generateMetadata(): Promise<Metadata> {
  const description = `I counted every stone step on the 4-day Classic Inca Trail: there are ${intComma(
    trek.totals.totalStairs,
  )} steps in total and ${intComma(
    trek.totals.minStairs,
  )} you must climb (at minimum). Paired with a GPS trek and 30m satellite elevation data, this is the most accurate map of the trail's stairs, and likely the most detailed map of the trail's elevation, anywhere.`;

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
      "Inca Trail elevation map",
      "Inca Trail stairs count",
      "Dead Woman's Pass elevation",
      "Machu Picchu trek",
    ],
  };
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="mx-auto mb-5 max-w-2xl text-2xl font-semibold ">
      {title}
    </h2>
  );
}

export default function IncaPage() {
  const faq = buildFaq(trek);
  const stairItems = buildStairItems();

  // SEOmaxx
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${CANONICAL}#article`,
        headline: "How Many Steps Are on the Inca Trail?",
        description: `A hand count of every stone step on the Classic Inca Trail—${intComma(
          trek.totals.totalStairs,
        )} in total, ${intComma(
          trek.totals.minStairs,
        )} at minimum—drawn on the trail's real GPS elevation profile.`,
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
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16 skibidiwrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero trek={trek} />

      <section className="mt-14">
        <SectionHeading title="Where all the steps are" />
        <p className="mx-auto mb-5 max-w-2xl ">
          The Inca Trail isn&rsquo;t one long staircase. It&rsquo;s a {trek.totalKm.toFixed(0)}-kilometre
          walk over a {intComma(trek.maxElev)}-metre pass and a long stone descent to Machu Picchu,
          with the steps bunched on the steepest pitches — gentle along the river, relentless on the
          drop through Phuyupatamarca. The chart below is the real trail: true elevation from a GPS
          track and topographic data, grey where you walk on dirt and red where the Incas laid stone.
          Drag to move along it, and zoom in until the red breaks into the individual steps.
        </p>
        <TrekProfile trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading title="Where the steps fall, day by day" />
        <p className="mx-auto mb-6 max-w-2xl ">
          The four days are nothing alike. The first is a gentle warm-up along the river; the second
          is the brutal climb to Dead Woman&rsquo;s Pass; the third is the longest, an endless stone
          descent through the cloud forest; the fourth is a short pre-dawn push to the Sun Gate. Here
          is how the count splits across them.
        </p>
        <DayBreakdown days={trek.perDay} />
      </section>

      <section className="mt-16">
        <SectionHeading title="How I counted them" />
        <Methodology trek={trek} />
      </section>

      <section className="mt-16">
        <SectionHeading title="The Inca Trail steps, answered" />
        <Faq items={faq} />
      </section>


      <figure className="mx-auto mt-12 max-w-2xl">
        <Image
          src="/inca/inca-trail-steps.jpg"
          alt="An open field notebook headed &ldquo;Stones,&rdquo; its grid pages filled with handwritten step tallies, propped on a grassy ridge with cloud-wrapped Andean peaks behind."
          width={1024}
          height={768}
          className="h-auto w-full rounded-xl"
        />
        <figcaption className="mt-3 text-sm text-muted dark:text-muted-dark">
          A picture of my notebook, taken at Intipata. The handwriting has
          been redrawn by Gemini for privacy, so it&rsquo;s slightly inaccurate in places.
        </figcaption>
      </figure>

      <p className="mx-auto mt-16 max-w-2xl text-sm text-muted dark:text-muted-dark">
        These are my personal counts, and I admit that I could be off by up to 2%. It&rsquo;s also worth noting that the stairs I counted were only the
        intentional and significant elevation-changing steps that the Incas built.<br /><br />

        This means I didn&rsquo;t count many steps on the third day (which had steep cobbled ramps) that a casual hiker may consider a &ldquo;step.&rdquo; In all, I&rsquo;d estimate that there are around 1.5x more stepping motions than steps on the trail.<br /><br />

        If you&rsquo;d like the raw data, please reach out to me at <Link href="/contact" className="link">borisnezlobin.com/contact</Link>.
      </p>
    </main>
  );
}
