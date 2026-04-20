import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";

type PageHeroProps = {
  locale: Locale;
  title: string;
  lead: string;
  image: ImageAsset;
  eyebrow?: string;
};

export function PageHero({ locale, title, lead, image, eyebrow }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--ink)] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${image.src})` }}
        role="img"
        aria-label={text(image.alt, locale)}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,24,19,0.86),rgba(15,24,19,0.42))]" />
      <div className="mx-auto max-w-7xl motion-rise">
        {eyebrow ? <p className="mb-4 text-xs font-bold uppercase text-white/62">{eyebrow}</p> : null}
        <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">{lead}</p>
      </div>
    </section>
  );
}
