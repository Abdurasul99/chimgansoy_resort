import type { Locale } from "@/i18n/config";
import { resortImages } from "@/content/images";
import { text } from "@/lib/localize";

/**
 * PhotoMarquee — two infinite film strips of real resort photos drifting in
 * opposite directions. Pure CSS animation (translateX on a duplicated track,
 * GPU-composited), pauses on hover so people can actually look at a photo.
 */

/**
 * Deliberately a MIX, not a clean swap to the new shoot.
 *
 * The strip is the first thing under the hero, so it has to state what this
 * place is — and that is still primarily day-use: topchan, mangal, kazan,
 * food. Twelve cabin interiors would quietly re-pitch the site as a hotel.
 * So: the new A-frame material earns half the frames, the day-use story keeps
 * the other half.
 *
 * The old "no A-frame shots here" rule is lifted — it existed because the
 * cabins were still open shells. They are finished and furnished now.
 */
const ROW_A = [
  "galTopchanPeaks",
  "galFoodServing",
  "aframeLawnWide",
  "galKazanStone",
  "galTopchanSwing",
  "aframeTerraceView",
] as const;

const ROW_B = [
  "aframeRoom",
  "galMangalFire",
  "aframeBed",
  "galTerritoryPanorama",
  "aframeLounge",
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
