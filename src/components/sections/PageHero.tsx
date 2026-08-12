import type { ImageAsset } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { frameStyle, imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

/**
 * Фон шапки: либо кадр из реестра с тремя подписями, либо загруженный
 * оператором — у такого подпись одна, и притворяться, что их три, незачем.
 */
type PageHeroProps = {
  locale: Locale;
  title: string;
  lead: string;
  image?: ImageAsset;
  frame?: { src: string; localSrc?: string; position?: string };
  frameAlt?: string;
  eyebrow?: string;
};

export function PageHero({ locale, title, lead, image, frame, frameAlt, eyebrow }: PageHeroProps) {
  const style = image ? imageStyle(image) : frameStyle(frame ?? { src: "" });
  const alt = image ? text(image.alt, locale) : frameAlt ?? "";
  return (
    <section
      // Solid dark base (season-proof) so the white heading stays legible while
      // the background photo is still loading — avoids a cream/blank flash.
      className="relative isolate flex min-h-[60vh] items-end overflow-hidden -mt-[4.5rem] bg-[#0f1928]"
      aria-label={title}
    >
      <div
        className="absolute inset-0 -z-20 scale-[1.02] bg-cover bg-center"
        style={style}
        role="img"
        aria-label={alt}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(15,25,40,0.65)_58%,rgba(15,25,40,0.92)_100%)]" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-28 sm:pb-14 sm:pt-44 sm:px-6 lg:pb-20 lg:px-8">
        <div className="motion-rise">
          {eyebrow && (
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/80">{eyebrow}</p>
          )}
          <h1 className="display-md font-serif font-bold text-white">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">{lead}</p>
        </div>
      </div>
    </section>
  );
}
