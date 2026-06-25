import {
  photoUrl,
  posterUrl,
  videoUrl,
  type CountingItem,
  type SimplePhoto,
} from "../lib/photos";

// The field evidence: what did and didn't get counted, and a few frames of the
// counting itself. Plain server-rendered figures — no interactivity needed.

function PhotoCard({ photo }: { photo: SimplePhoto }) {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl(photo.file)}
          alt={photo.caption}
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
      </div>
      <figcaption className="mt-2 text-sm text-muted dark:text-muted-dark">{photo.caption}</figcaption>
    </figure>
  );
}

function CountingCard({ item }: { item: CountingItem }) {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        {item.kind === "video" ? (
          <video
            className="aspect-[4/5] w-full object-cover"
            controls
            playsInline
            preload="none"
            poster={posterUrl(item.file)}
          >
            <source src={videoUrl(item.file)} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(item.file)}
            alt={item.caption}
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <figcaption className="mt-2 text-sm text-muted dark:text-muted-dark">{item.caption}</figcaption>
    </figure>
  );
}

export function PhotoGallery({
  notSteps,
  paving,
  counting,
}: {
  notSteps: SimplePhoto[];
  paving: SimplePhoto[];
  counting: CountingItem[];
}) {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="mx-auto max-w-2xl text-xl font-semibold text-light-foreground dark:text-dark-foreground">
          The judgement calls
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-light-foreground dark:text-dark-foreground">
          Most of the count is easy. The honesty is in the edges — loose rock, worn nubs, and paving
          that&apos;s flat enough to be a path. These are the ones I left out, or agonised over.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {notSteps.map((p) => (
            <PhotoCard key={p.file} photo={p} />
          ))}
          {paving.map((p) => (
            <PhotoCard key={p.file} photo={p} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mx-auto max-w-2xl text-xl font-semibold text-light-foreground dark:text-dark-foreground">
          Counting, in the field
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-light-foreground dark:text-dark-foreground">
          Four days, a notebook, and a lot of muttered numbers — including a short clip of the count
          in the rain.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {counting.map((c) => (
            <CountingCard key={c.file} item={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
