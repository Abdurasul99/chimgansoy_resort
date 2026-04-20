import { promotions } from "@/content/promotions";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

type PromoBandProps = {
  locale: Locale;
};

export function PromoBand({ locale }: PromoBandProps) {
  const dict = dictionaries[locale];
  const promo = promotions[0];

  return (
    <section className="relative isolate overflow-hidden bg-[var(--green)] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 -z-20 bg-cover opacity-50"
        style={imageStyle(resortImages.nightHero)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,18,14,0.92),rgba(12,18,14,0.62),rgba(12,18,14,0.44))]" />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.7fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase text-white/62">{text(promo.badge, locale)}</p>
          <h2 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            {dict.home.finalOfferTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/76">{dict.home.finalOfferText}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <ButtonLink href={localizePath(locale, "/bron")} variant="light">
            {dict.bookNow}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
