import type { ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { contacts } from "@/content/contacts";
import { restaurantText } from "@/content/restaurant";
import type { RestaurantSettings } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { heroImage, openNow } from "@/lib/restaurant/page";
import { RestIcon } from "./RestIcon";

/**
 * Страницы ресторана — светлые и спокойные, по образцу приложений доставки
 * (28.09.2026, владелец: «больше минимализма, больше маркетплейса»). Прежние
 * тёмные экраны с искрами, узорами и бегущей строкой убраны: они спорили с
 * едой за внимание, а гость пришёл за меню и кнопкой «Добавить».
 */

/** Плашка над витриной: предпросмотр владельца или «приём заказов скоро». */
export function Notice({ tone, children }: { tone: "preview" | "info"; children: ReactNode }) {
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === "preview" ? "bg-[#e7f5f6] text-[#0e5f67]" : "bg-[#fff4e0] text-[#6b4700]"
      }`}
    >
      {children}
    </p>
  );
}

/** Предпросмотр — только владельцу, пока раздел скрыт или закрыт. */
export function PreviewBanner({ locale }: { locale: Locale }) {
  const t = restaurantText(locale);
  return (
    <Notice tone="preview">
      {t.hiddenPreview}{" "}
      <a href={`/api/restaurant/preview?off=1&l=${locale}`} className="font-semibold underline underline-offset-2">
        {t.previewExit}
      </a>
    </Notice>
  );
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Карточка ресторана над меню: обложка, название, часы, пара честных
 * условий и две кнопки. Всё остальное — в «О ресторане», свёрнутым.
 */
export function StoreHeader({
  locale,
  settings,
  tablesOpen,
}: {
  locale: Locale;
  settings: RestaurantSettings;
  tablesOpen: boolean;
}) {
  const t = restaurantText(locale);
  const name = pickText(settings.name, locale);
  const tagline = pickText(settings.tagline, locale);
  const about = pickText(settings.about, locale);
  const announcement = pickText(settings.announcement, locale);
  const now = openNow(settings);
  const hours = settings.hoursOpen && settings.hoursClose ? `${settings.hoursOpen}–${settings.hoursClose}` : "";
  const phones = settings.phones.length ? settings.phones : [contacts.phone];

  const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f6f5f2] px-3 py-1.5";
  const action =
    "btn-press inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-[#f6f5f2] px-4 text-sm font-semibold text-[#1c1c1c] transition-colors hover:bg-[#ecebe7]";

  return (
    <header>
      <div className="h-36 overflow-hidden rounded-3xl bg-[#efece6] sm:h-48 lg:h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage(settings)} alt="" fetchPriority="high" className="h-full w-full object-cover" />
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-[#1c1c1c] sm:text-4xl">{name}</h1>
          {tagline && <p className="mt-1 text-[15px] text-[#6b6b6b]">{tagline}</p>}
          {/* На телефоне — одной строкой с прокруткой, а не столбиком на полэкрана. */}
          <ul className="rest-chips -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 text-[13px] text-[#3a3a3a] sm:mx-0 sm:flex-wrap sm:px-0">
            {hours && (
              <li className={chip}>
                {now !== null && <span className={`h-2 w-2 rounded-full ${now ? "bg-[#22a45d]" : "bg-[#b5b0a8]"}`} />}
                {now === null ? t.hours : now ? t.openNow : t.closedNow} · {hours}
              </li>
            )}
            <li className={chip}>{t.noOnlinePay}</li>
            <li className={chip}>{t.confirmByPhone}</li>
          </ul>
        </div>

        {/* Короткие подписи: по-узбекски «Stol band qilish» и «Qo'ng'iroq
            qilish» на 360 px переносились на две строки. */}
        <div className="flex shrink-0 gap-2">
          {tablesOpen && (
            <Link
              href={localizePath(locale, "/restaurant/tables")}
              prefetch={false}
              className={action}
            >
              <RestIcon name="table" className="h-4 w-4" />
              {t.tables.eyebrow}
            </Link>
          )}
          <a href={telHref(phones[0])} className={action}>
            <RestIcon name="phone" className="h-4 w-4" />
            {t.call}
          </a>
        </div>
      </div>

      {announcement && <p className="mt-4 rounded-2xl bg-[#fff4e0] px-4 py-3 text-sm font-semibold text-[#6b4700]">{announcement}</p>}

      <details className="group mt-4 rounded-2xl border border-[#ececec] px-4 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#1c1c1c]">
          {t.aboutTitle}
          <RestIcon name="arrow" className="h-4 w-4 rotate-90 text-[#8c8c8c] transition-transform group-open:-rotate-90" />
        </summary>
        <div className="grid gap-5 pb-5 pt-1 text-sm leading-6 text-[#4a4a4a] md:grid-cols-3">
          {about && <p className="md:col-span-3">{about}</p>}
          <div>
            <p className="font-semibold text-[#1c1c1c]">{t.hours}</p>
            <p className="mt-1">{hours || t.hoursUnknown}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1c1c1c]">{t.phone}</p>
            {phones.map((p) => (
              <a key={p} href={telHref(p)} className="flex min-h-10 items-center hover:text-[#1c1c1c]">
                {p}
              </a>
            ))}
            {(settings.instagram || settings.telegram) && (
              <p className="mt-2 flex gap-3">
                {settings.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    Instagram
                  </a>
                )}
                {settings.telegram && (
                  <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    Telegram
                  </a>
                )}
              </p>
            )}
          </div>
          <div>
            <p className="font-semibold text-[#1c1c1c]">{t.roomNoteTitle}</p>
            <p className="mt-1">{t.roomNote}</p>
          </div>
        </div>
      </details>
    </header>
  );
}

/** Заголовок служебных страниц ресторана: «← Назад в меню» и название. */
export function PageTitle({ locale, title, lead }: { locale: Locale; title: string; lead?: string }) {
  const t = restaurantText(locale);
  return (
    <div>
      <Link
        href={localizePath(locale, "/restaurant")}
        prefetch={false}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[#6b6b6b] transition-colors hover:text-[#1c1c1c]"
      >
        <RestIcon name="arrow" className="h-4 w-4 rotate-180" />
        {t.backToMenu}
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1c1c1c] sm:text-4xl">{title}</h1>
      {lead && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6b6b6b]">{lead}</p>}
    </div>
  );
}
