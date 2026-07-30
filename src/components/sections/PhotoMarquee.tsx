import type { Locale } from "@/i18n/config";
import { resortImages } from "@/content/images";
import { text } from "@/lib/localize";

/**
 * PhotoMarquee — two infinite film strips of real resort photos drifting in
 * opposite directions. Pure CSS animation (translateX on a duplicated track,
 * GPU-composited), pauses on hover so people can actually look at a photo.
 */

/**
 * The strip is the first thing under the hero, so it states what this place
 * is — and that is a resort you stay at. Row A is the stay: cabin exteriors,
 * chalet lounge, A-frame interior, the ridge from a terrace. Row B carries the
 * grounds and the food, which support the stay rather than replace it.
 *
 * It used to be a deliberate 50/50 split with the topchan/mangal/kazan day-use
 * set, on the reasoning that day-use was the primary product. It isn't any
 * more, so the split moved with it — two day-use frames remain in row B
 * because the day visit is still sold, just no longer the pitch.
 */
const ROW_A = [
  "aframeLawnWide",
  "chaletLounge",
  "aframeRoom",
  "aframeTerraceView",
  "chaletBedroomDouble",
  "aframeLounge",
] as const;

const ROW_B = [
  "galTerritoryPanorama",
  "chaletDining",
  "galMangalFire",
  "aframeBed",
  "galFoodServing",
  "galGreenHills",
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
