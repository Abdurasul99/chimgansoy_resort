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
    <footer className="bg-[var(--ink)] text-white">
      {/* Editorial top — logotype + contact CTA */}
      <div className="border-b border-white/8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
                {locale === "ru" ? "Горный курорт" : locale === "uz" ? "Tog' kurort" : "Mountain resort"}
                {" · "}
                {locale === "ru" ? "Узбекистан" : locale === "uz" ? "O'zbekiston" : "Uzbekistan"}
              </p>
              <p className="mt-3 font-serif text-[clamp(2.5rem,7vw,5rem)] font-bold leading-none tracking-tight">
                CHIMGANSOY
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${contacts.phone.replaceAll(" ", "")}`}
                className="btn-press inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
              >
                {contacts.phone}
              </a>
              <a
                href={contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/18"
              >
                WhatsApp
              </a>
              <a
                href={contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/18"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation + contact form */}
      <div className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-[1fr_1.8fr]">
          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                {locale === "ru" ? "Контакты" : locale === "uz" ? "Kontaktlar" : "Contact"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-white/60">
                <p>{text(contacts.address, locale)}</p>
                <a href={`tel:${contacts.phone.replaceAll(" ", "")}`} className="block transition-colors hover:text-white">
                  {contacts.phone}
                </a>
                <a href={`mailto:${contacts.email}`} className="block transition-colors hover:text-white">
                  {contacts.email}
                </a>
              </div>
            </div>

            {/* Nav columns */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-2">
              {footerNavigation.slice(0, 2).map((group) => (
                <div key={text(group.title, locale)}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{text(group.title, locale)}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {group.links.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={localizePath(locale, item.href)}
                          className="text-sm text-white/60 transition-colors hover:text-white"
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

          {/* Contact form */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{dict.footer.formTitle}</p>
            <p className="mt-3 text-sm leading-6 text-white/50">{dict.footer.formLead}</p>
            <div className="mt-6">
              <ContactForm dict={dict.footer} />
            </div>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-white/8 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © 2026 CHIMGANSOY. {dict.footer.legalNote}
          </p>
          <p className="text-xs text-white/20">chimgansoy.com</p>
        </div>
      </div>
    </footer>
  );
}
