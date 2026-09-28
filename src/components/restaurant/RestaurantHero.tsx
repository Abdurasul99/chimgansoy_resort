import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import type { OrderMode, RestaurantSettings } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { heroImage, openNow } from "@/lib/restaurant/page";
import { Embers, IkatBand, Rosette } from "./Ornaments";
import { GlowLink } from "./GlowLink";
import { RestIcon, type RestIconName } from "./RestIcon";
import { TopNotice } from "./RestaurantSections";

/**
 * Первый экран ресторана: живое фото, искры, название-пламя и четыре
 * действия из ТЗ (п. 2) — меню, стол, доставка, в номер. Самовывоз
 * выбирается при оформлении, отдельной плитки у него нет.
 */
export function RestaurantHero({
  locale,
  settings,
  openModes,
  tablesOpen,
  notice,
}: {
  locale: Locale;
  settings: RestaurantSettings;
  openModes: OrderMode[];
  tablesOpen: boolean;
  /** Плашка под шапкой сайта — см. TopNotice. */
  notice?: ReactNode;
}) {
  const t = restaurantText(locale);
  const name = pickText(settings.name, locale);
  const tagline = pickText(settings.tagline, locale);
  const announcement = pickText(settings.announcement, locale);
  const now = openNow(settings);
  const hours = settings.hoursOpen && settings.hoursClose ? `${settings.hoursOpen}–${settings.hoursClose}` : "";

  const tiles: { key: string; icon: RestIconName; title: string; text: string; href: string; from: string; to: string; off?: boolean }[] = [
    { key: "menu", icon: "menu", ...t.actions.menu, href: "/restaurant/menu", from: "#f4a52a", to: "#ff6a2b" },
    { key: "tables", icon: "table", ...t.actions.tables, href: "/restaurant/tables", from: "#17a3b0", to: "#2c9a5b", off: !tablesOpen },
    {
      key: "delivery",
      icon: "delivery",
      ...t.actions.delivery,
      href: openModes.includes("delivery") ? "/restaurant/menu?mode=delivery" : "/restaurant/menu",
      from: "#ff6a2b",
      to: "#d6352b",
      off: !openModes.includes("delivery"),
    },
    {
      key: "room",
      icon: "room",
      ...t.actions.room,
      href: openModes.includes("room") ? "/restaurant/menu?mode=room" : "/restaurant/menu",
      from: "#2c9a5b",
      to: "#17a3b0",
      off: !openModes.includes("room"),
    },
  ];

  return (
    <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-[#140f0c] text-white" aria-label={name}>
      {/* Фото — обычный img: кадр либо загружен в админке, либо лежит в public. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage(settings)}
        alt=""
        className="rest-kenburns absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,15,12,0.55)_0%,rgba(20,15,12,0.35)_35%,rgba(20,15,12,0.92)_78%,#140f0c_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(255,106,43,0.45),transparent_70%)]" />
      <Embers />
      <Rosette size={420} className="rest-spin pointer-events-none absolute -right-40 -top-40 -z-10 opacity-[0.16] sm:-right-24 sm:-top-24" />
      <Rosette size={260} className="rest-spin pointer-events-none absolute -bottom-24 -left-28 -z-10 opacity-[0.12]" colors={["#17a3b0", "#f4a52a", "#d6352b"]} />

      <TopNotice notice={notice} />
      <div className={`mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8 ${notice ? "pt-12 sm:pt-20" : "pt-32 sm:pt-40"}`}>
        <div className="motion-rise max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffc46b] backdrop-blur">
              <RestIcon name="flame" className="h-3.5 w-3.5 text-[#ff8a3d]" />
              {t.eyebrow}
            </span>
            {now !== null && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                <span className={`h-2.5 w-2.5 rounded-full ${now ? "rest-live bg-[#34d378]" : "bg-white/40"}`} />
                {now ? t.openNow : t.closedNow}
                {hours && <span className="text-white/60">· {hours}</span>}
              </span>
            )}
          </div>

          <h1 className="mt-6 font-serif text-[clamp(3.6rem,13vw,9.5rem)] font-bold italic leading-[0.88] tracking-tight">
            <span className="rest-flame-text">{name}</span>
          </h1>
          {tagline && <p className="mt-5 text-xl font-semibold text-white/90 sm:text-2xl">{tagline}</p>}

          {announcement && (
            <p className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-2xl border border-[#ffa53d]/40 bg-gradient-to-r from-[#ff6a2b]/25 to-[#d6352b]/20 px-4 py-3 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(255,106,43,0.7)] backdrop-blur">
              <RestIcon name="flame" className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb35c]" />
              {announcement}
            </p>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {tiles.map((tile) => (
            <GlowLink
              key={tile.key}
              href={localizePath(locale, tile.href)}
              className="group flex min-h-40 flex-col rounded-3xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md hover:border-white/30 sm:min-h-48 sm:p-6"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14"
                style={{ background: `linear-gradient(135deg, ${tile.from}, ${tile.to})` }}
              >
                <RestIcon name={tile.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="mt-4 font-serif text-xl font-bold leading-tight sm:text-2xl">{tile.title}</span>
              <span className="mt-1.5 hidden text-sm leading-5 text-white/65 sm:block">{tile.text}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-extrabold uppercase tracking-wider text-[#ffb35c]">
                {tile.off ? t.byPhone : <RestIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </span>
            </GlowLink>
          ))}
        </div>
      </div>

      <IkatBand height={22} animated />
    </section>
  );
}
