import type { QA } from "../lib/content";

// Visible, crawlable Q&A. The same items feed the FAQPage JSON-LD in the page,
// so what Google reads matches what a visitor reads.
export function Faq({ items }: { items: QA[] }) {
  return (
    <div className="max-w-2xl divide-y divide-neutral-200 dark:divide-neutral-700">
      {items.map((item) => (
        <div key={item.q} className="py-5 first:pt-0">
          <h3 className="text-lg font-semibold text-light-foreground dark:text-dark-foreground">
            {item.q}
          </h3>
          <p className="mt-2 text-light-foreground dark:text-dark-foreground">{item.a}</p>
        </div>
      ))}
    </div>
  );
}
