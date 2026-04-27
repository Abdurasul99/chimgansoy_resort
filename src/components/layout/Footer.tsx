import Link from "next/link";
import { contacts } from "@/content/contacts";
import { footerNavigation } from "@/content/navigation";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { ContactForm } from "@/components/layout/ContactForm";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  const dict = dictionaries[locale];

  return (
    <footer className="bg-[var(--surface)] text-[var(--ink)]">
      <div className="border-b border-[var(--line)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                {locale === "ru" ? "Горный курорт" : locale === "uz" ? "Tog' kurort" : "Mountain resort"}
                {" · "}
                {locale === "ru" ? "Узбекистан" : locale === "uz" ? "O'zbekiston" : "Uzbekistan"}
              </p>
              <p className="mt-3 font-serif text-[clamp(2.5rem,7vw,5rem)] font-bold leading-none tracking-tight text-[var(--ink)]">
                CHIMGANSOY
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${contacts.phone.replaceAll(" ", "")}`}
                className="btn-press inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-all duration-300 hover:bg-[var(--sun)] hover:border-[var(--sun)] hover:text-white"
              >
                {contacts.phone}
              </a>
              <a
                href={contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center rounded-full bg-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-all duration-300 hover:bg-[var(--sun)] hover:text-white"
              >
                WhatsApp
              </a>
              <a
                href={contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center rounded-full bg-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-all duration-300 hover:bg-[var(--sky)] hover:text-white"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-[1fr_1.8fr]">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                {locale === "ru" ? "Контакты" : locale === "uz" ? "Kontaktlar" : "Contact"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <p>{text(contacts.address, locale)}</p>
                <a href={`tel:${contacts.phone.replaceAll(" ", "")}`} className="block transition-colors hover:text-[var(--sun)]">
                  {contacts.phone}
                </a>
                <a href={`mailto:${contacts.email}`} className="block transition-colors hover:text-[var(--sun)]">
                  {contacts.email}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-2">
              {footerNavigation.slice(0, 2).map((group) => (
                <div key={text(group.title, locale)}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{text(group.title, locale)}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {group.links.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={localizePath(locale, item.href)}
                          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--sun)]"
                        >
                          {text(item.label, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{dict.footer.formTitle}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dict.footer.formLead}</p>
            <div className="mt-6">
              <ContactForm dict={dict.footer} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--line)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)]">
            © 2026 CHIMGANSOY. {dict.footer.legalNote}
          </p>
          <p className="text-xs text-[var(--muted)]/60">chimgansoy.com</p>
        </div>
      </div>
    </footer>
  );
}
