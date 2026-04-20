import { contacts } from "@/content/contacts";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { ButtonLink } from "./ButtonLink";

type ContactActionsProps = {
  locale: Locale;
  compact?: boolean;
};

export function ContactActions({ locale, compact = false }: ContactActionsProps) {
  const dict = dictionaries[locale];

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${compact ? "sm:flex-wrap" : ""}`}>
      <ButtonLink href={`tel:${contacts.phone.replaceAll(" ", "")}`} variant="secondary" icon="phone" external>
        {dict.call}
      </ButtonLink>
      <ButtonLink href={contacts.whatsapp} variant="ghost" icon="whatsapp" external>
        {dict.writeWhatsapp}
      </ButtonLink>
      <ButtonLink href={contacts.telegram} variant="ghost" icon="telegram" external>
        {dict.writeTelegram}
      </ButtonLink>
    </div>
  );
}
