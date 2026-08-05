import type { Locale } from "@/i18n/config";
import { resortImages } from "@/content/images";
import { text } from "@/lib/localize";

/**
 * PhotoMarquee — two infinite film strips of real resort photos drifting in
 * opposite directions. Pure CSS animation (translateX on a duplicated track,
 * GPU-composited), pauses on hover so people can actually look at a photo.
 */

/**
 * The strip is the first thing under the hero, so it states what this place is.
 *
 * The two rows now carry different subjects rather than the same subject twice:
 * Row A is the August-2026 shoot — the pool and the chalets, alternating, which
 * are the two things sold. Row B is the grounds and the insides — topchans
 * under the ridge, the path between the cabins, a chalet dining room, an
 * A-frame lounge.
 *
 * Row A alternates pool/cabin deliberately. Six of the same in a row is
 * unreadable at marquee size: the eye gets one long blur and learns nothing.
 * The same rule retired an earlier Row B that was six interior close-ups (a
 * minibar, a made bed, a kitchen worktop) passing as a blur of beige — which
 * is why Row B is grounds-first, with only two interiors in it.
 *
 * Nothing here is a rendering, nothing is from the construction-era set where
 * the ground is still geotextile and sand, and — since 2026-08-04 — nothing
 * here appears anywhere else on the homepage. `poolDeckChalets` left because
 * it is the hero's third slide; `aframeLawnWide` left because it carries a
 * tower crane in the sky, which nobody had caught while it sat in a strip
 * that never stops moving.
 */
const ROW_A = [
  "poolCurveTall",
  "chaletLawn",
  "mountainRidge",
  "chaletRowTall",
  "poolWater",
  "chaletExterior",
] as const;

const ROW_B = [
  "galTopchanPeaks",
  "chaletDining",
  "galTopchanRidge",
  "aframeLounge",
  "galPathway",
  "galTopchanRow",
] as const;

/**
 * The strip's own copy of a photograph, 560px tall.
 *
 * The cards render at ~250px, and the masters are 2200–2400px files: about
 * 4 MB for a decorative band that sits above anything a guest can act on, and
 * competes with the hero's own photograph for the first seconds of bandwidth.
 * scripts/make-strip-derivatives.js writes these; 5.7 MB became 550 KB.
 *
 * There is no runtime fallback to the master: this is a server component, and
 * shipping a client component purely to catch a missing file would cost more
 * than the problem. `scripts/check-home-photos.js` asserts that every key in
 * the strip has a derivative, so a frame added without regenerating fails the
 * check rather than reaching a guest as a broken image.
 */
function stripSrc(full: string): string {
  const name = full.split("/").pop()?.replace(/\.(png|webp|jpeg)$/i, ".jpg");
  return name ? `/images/resort/strip/${name}` : full;
}

function Card({ imageKey, locale, alt }: { imageKey: keyof typeof resortImages; locale: Locale; alt: boolean }) {
  const img = resortImages[imageKey];
  const full = img.localSrc ?? img.src;
  return (
    <div className="marquee-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stripSrc(full)}
        alt={alt ? text(img.alt, locale) : ""}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function Strip({ keys, reverse, locale }: { keys: readonly (keyof typeof resortImages)[]; reverse?: boolean; locale: Locale }) {
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}>
        {keys.map((key) => (
          <Card key={key} imageKey={key} locale={locale} alt />
        ))}

        {/* The second copy exists only to make `translateX(-50%)` loop without
            a seam. It is desktop-only for two reasons: below 1024px the track
            no longer animates (it is swiped instead — see globals.css), so
            there is nothing for it to hide; and a strip you scroll by hand
            would show the same six photos twice in a row, which is precisely
            the repetition the operator asked us to get rid of.

            `lg:contents`, not `lg:flex`: the copies have to become flex items
            of the track itself, not children of a nested box. */}
        <div className="hidden lg:contents">
          {keys.map((key) => (
            <Card key={`dup-${key}`} imageKey={key} locale={locale} alt={false} />
          ))}
        </div>
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
