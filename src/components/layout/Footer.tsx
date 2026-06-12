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
    <footer className="relative overflow-hidden bg-[var(--mountain)]">
      {/* Aurora band — animated aurora glow at the top in winter */}
      <div className="aurora-band pointer-events-none absolute left-0 right-0 top-0 h-32" aria-hidden="true" />

      {/* Mountain silhouette SVG */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 overflow-hidden" style={{ height: "120px" }} aria-hidden="true">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.12, color: "rgba(255,255,255,0.9)" }}
        >
          <path
            d="M0 120 L0 80 L80 40 L160 70 L240 20 L320 60 L400 10 L480 50 L560 5 L640 45 L720 0 L800 40 L880 15 L960 55 L1040 8 L1120 48 L1200 22 L1280 62 L1360 30 L1440 70 L1440 120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="relative border-b border-[var(--line)] px-4 py-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                {locale === "ru" ? "Горный курорт" : locale === "uz" ? "Tog' kurort" : "Mountain resort"}
                {" · "}
                {locale === "ru" ? "Узбекистан" : locale === "uz" ? "O'zbekiston" : "Uzbekistan"}
              </p>
              <p className="text-glow-brand mt-3 font-serif text-[clamp(2.5rem,7vw,5rem)] font-bold leading-none tracking-tight text-[var(--ink)]">
                CHIMGAN DARBAZA
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:${contacts.phone.replaceAll(" ", "")}`}
                className="btn-press glass-btn inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300"
              >
                {contacts.phone}
              </a>
              <a
                href={contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press glass-btn inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300"
              >
                WhatsApp
              </a>
              <a
                href={contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press glass-btn inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300"
              >
                Telegram
              </a>
              <a
                href={contacts.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press glass-btn inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300"
              >
                Instagram
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
                          prefetch={false}
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
            © 2026 CHIMGAN DARBAZA. {dict.footer.legalNote}
          </p>
          <p className="text-xs text-[var(--muted)]/60">chimgandarbaza.uz</p>
        </div>
      </div>
    </footer>
  );
}
