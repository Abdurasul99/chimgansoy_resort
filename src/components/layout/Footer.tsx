import Link from "next/link";
import { contacts } from "@/content/contacts";
import { footerNavigation } from "@/content/navigation";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { Icon } from "@/components/ui/Icon";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  const dict = dictionaries[locale];

  return (
    <footer className="bg-[var(--ink)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1.4fr] lg:px-8">
        <div>
          <p className="font-serif text-4xl font-bold">CHIMGANSOY</p>
          <p className="mt-4 max-w-md text-base leading-7 text-white/72">{dict.brandLine}</p>

          <div className="mt-8 space-y-4 text-sm text-white/78">
            <a className="flex items-center gap-3 transition hover:text-white" href={`tel:${contacts.phone.replaceAll(" ", "")}`}>
              <Icon name="phone" className="h-4 w-4" />
              {contacts.phone}
            </a>
            <a className="flex items-center gap-3 transition hover:text-white" href={`mailto:${contacts.email}`}>
              <Icon name="mail" className="h-4 w-4" />
              {contacts.email}
            </a>
            <p className="flex items-start gap-3">
              <Icon name="map" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{text(contacts.address, locale)}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {footerNavigation.map((group) => (
            <div key={text(group.title, locale)}>
              <h3 className="text-sm font-bold uppercase text-white/52">{text(group.title, locale)}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link href={localizePath(locale, item.href)} className="text-sm text-white/76 transition hover:text-white">
                      {text(item.label, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h3 className="font-serif text-3xl font-semibold">{dict.footer.formTitle}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/66">{dict.footer.formLead}</p>
          </div>
          <form className="grid gap-3 sm:grid-cols-2">
            <input className="footer-input" type="text" placeholder={dict.footer.name} aria-label={dict.footer.name} />
            <input className="footer-input" type="tel" placeholder={dict.footer.phone} aria-label={dict.footer.phone} />
            <textarea className="footer-input min-h-28 sm:col-span-2" placeholder={dict.footer.message} aria-label={dict.footer.message} />
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] sm:w-fit">
              <span>{dict.footer.send}</span>
              <Icon name="send" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs leading-5 text-white/50">
        <p>© 2026 CHIMGANSOY.UZ / CHIMGANSOY.COM. {dict.footer.legalNote}</p>
      </div>
    </footer>
  );
}
