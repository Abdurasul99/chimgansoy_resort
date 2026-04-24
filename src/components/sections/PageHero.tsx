import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { imageStyle } from "@/lib/images";
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
    <section
      className="relative isolate flex min-h-[60vh] items-end overflow-hidden bg-[var(--ink)] -mt-[4.5rem]"
      aria-label={title}
    >
      <div
        className="absolute inset-0 -z-20 scale-[1.02] bg-cover bg-center"
        style={imageStyle(image)}
        role="img"
        aria-label={text(image.alt, locale)}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.97)_0%,rgba(12,18,14,0.55)_50%,rgba(12,18,14,0.12)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,18,14,0.55)_0%,transparent_60%)]" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-28 sm:pb-14 sm:pt-44 sm:px-6 lg:pb-20 lg:px-8">
        <div className="motion-rise">
          {eyebrow && (
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{eyebrow}</p>
          )}
          <h1 className="display-md font-serif font-bold text-white">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/60">{lead}</p>
        </div>
      </div>
    </section>
  );
}
