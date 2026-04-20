import { contacts } from "@/content/contacts";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";
import { ContactActions } from "@/components/ui/ContactActions";
import { Icon } from "@/components/ui/Icon";

type MapBlockProps = {
  locale: Locale;
};

export function MapBlock({ locale }: MapBlockProps) {
  const dict = dictionaries[locale];

  return (
    <div className="grid overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white lg:grid-cols-[0.85fr_1.15fr]">
      <div className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{contacts.mapCoordinates}</p>
        <h3 className="mt-3 font-serif text-4xl font-semibold text-[var(--ink)]">{dict.home.mapTitle}</h3>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">{text(contacts.address, locale)}</p>
        <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{text(contacts.schedule, locale)}</p>
        <div className="mt-6">
          <ContactActions locale={locale} compact />
        </div>
      </div>
      <div className="relative min-h-80 bg-[var(--mist)]">
        <div className="absolute inset-4 rounded-[8px] border border-[color:var(--line-strong)] bg-[linear-gradient(135deg,#d8e6e0,#f5efe5)]">
          <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--green)] text-white shadow-[0_18px_50px_rgba(20,61,45,0.22)]">
            <Icon name="map" className="h-8 w-8" />
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-[6px] bg-white/88 p-4 text-sm font-semibold text-[var(--ink)] backdrop-blur">
            CHIMGANSOY.UZ / CHIMGANSOY.COM
          </div>
        </div>
      </div>
    </div>
  );
}
