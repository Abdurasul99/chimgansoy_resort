import { promotions } from "@/content/promotions";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

type PromoBandProps = {
  locale: Locale;
};

export function PromoBand({ locale }: PromoBandProps) {
  const dict = dictionaries[locale];
  const promo = promotions[0];

  return (
    <section className="bg-[var(--green)] px-4 py-14 text-white sm:px-6 lg:px-8">
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
