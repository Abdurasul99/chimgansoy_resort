import type { Locale } from "@/i18n/config";
import { resortImages } from "@/content/images";
import { text } from "@/lib/localize";

/**
 * PhotoMarquee — two infinite film strips of real resort photos drifting in
 * opposite directions. Pure CSS animation (translateX on a duplicated track,
 * GPU-composited), pauses on hover so people can actually look at a photo.
 */

/**
 * The strip is the first thing under the hero, so it states what this place is:
 * twelve frames of the pool and the chalets, which are the two things sold.
 *
 * Both rows alternate subject deliberately — a pool frame, then a chalet frame,
 * then a pool frame. Six of the same in a row is unreadable at marquee size:
 * the eye gets one long blur and learns nothing. The same rule retired an
 * earlier Row B that was six interior close-ups (a minibar, a made bed, a
 * kitchen worktop) passing as a blur of beige.
 *
 * Ten of the twelve are the August-2026 shoot. Nothing here is from the
 * construction-era set, where the ground is still geotextile and sand, and
 * nothing here is a rendering.
 */
const ROW_A = [
  "poolWideChalets",
  "chaletLawn",
  "poolLoungers",
  "chaletFront",
  "poolCabanasSky",
  "chaletRowTall",
] as const;

const ROW_B = [
  "poolDeckChalets",
  "chaletLounge",
  "poolCurveTall",
  "chaletDining",
  "poolWater",
  "aframeLawnWide",
] as const;

function Strip({ keys, reverse, locale }: { keys: readonly (keyof typeof resortImages)[]; reverse?: boolean; locale: Locale }) {
  // The track is rendered twice back-to-back; animating -50% loops seamlessly.
  const photos = [...keys, ...keys];
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}>
        {photos.map((key, i) => {
          const img = resortImages[key];
          return (
            <div key={`${key}-${i}`} className="marquee-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.localSrc ?? img.src}
                alt={i < keys.length ? text(img.alt, locale) : ""}
                loading="lazy"
                decoding="async"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PhotoMarquee({ locale }: { locale: Locale }) {
  return (
    <section className="overflow-hidden py-4 sm:py-6" aria-label="Photo strip">
      <Strip keys={ROW_A} locale={locale} />
      <div className="h-3 sm:h-4" />
      <Strip keys={ROW_B} reverse locale={locale} />
    </section>
  );
}
