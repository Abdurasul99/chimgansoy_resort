import { contacts } from "@/content/contacts";
import { googleMapsIntegration } from "@/content/integrations";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";
import { getGoogleMapsEmbedUrl } from "@/lib/maps";
import { ContactActions } from "@/components/ui/ContactActions";

type MapBlockProps = {
  locale: Locale;
};

export function MapBlock({ locale }: MapBlockProps) {
  const dict = dictionaries[locale];
  const mapSrc = getGoogleMapsEmbedUrl();

  return (
    <div className="grid overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white lg:grid-cols-[0.85fr_1.15fr]">
      <div className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{contacts.mapCoordinates}</p>
        <h3 className="mt-3 font-serif text-4xl font-semibold text-[var(--ink)]">{dict.home.mapTitle}</h3>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">{text(contacts.address, locale)}</p>
        <a
          href={contacts.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--green)]"
        >
          {text(googleMapsIntegration.placeName, locale)}
        </a>
        <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{text(contacts.schedule, locale)}</p>
        <div className="mt-6">
          <ContactActions locale={locale} compact />
        </div>
      </div>
      <div className="relative min-h-80 bg-[var(--mist)]">
        <iframe
          title={text(googleMapsIntegration.placeName, locale)}
          src={mapSrc}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
