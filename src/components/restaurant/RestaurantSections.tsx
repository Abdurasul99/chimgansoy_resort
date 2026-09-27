import type { ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { contacts } from "@/content/contacts";
import { restaurantText } from "@/content/restaurant";
import { resortImages } from "@/content/images";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import type { RestaurantSettings } from "@/lib/restaurant/model";
import { openNow } from "@/lib/restaurant/page";
import { IkatBand, Rosette, Steam } from "./Ornaments";
import { RestIcon } from "./RestIcon";

/** Полоса предпросмотра — только владельцу, пока раздел скрыт или закрыт. */
export function PreviewBanner({ locale }: { locale: Locale }) {
  const t = restaurantText(locale);
  return (
    <div className="relative z-[55] bg-[repeating-linear-gradient(135deg,#17a3b0_0_14px,#128895_14px_28px)] px-4 py-2 text-center text-xs font-bold text-white">
      {t.hiddenPreview}{" "}
      <a href={`/api/restaurant/preview?off=1&l=${locale}`} className="underline underline-offset-2">
        {t.previewExit}
      </a>
    </div>
  );
}

/** Бегущая строка: разделы меню или, пока меню нет, слова о месте. */
export function Ticker({ words }: { words: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center">
          <span className="px-6 font-serif text-4xl font-bold italic text-[#fff3dc] sm:text-6xl">{w}</span>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
            <path d="M11 1 L21 11 L11 21 L1 11 Z" fill="#140f0c" />
            <path d="M11 6 L16 11 L11 16 L6 11 Z" fill={["#ffd27a", "#17a3b0", "#2c9a5b"][i % 3]} />
          </svg>
        </span>
      ))}
    </div>
  );
  return (
    <div className="rest-ticker bg-gradient-to-r from-[#d6352b] via-[#ff6a2b] to-[#f4a52a] py-5 sm:py-7" aria-hidden="true">
      <div className="rest-ticker__track">
        {row}
        {row}
      </div>
    </div>
  );
}

/** «Как это работает» — три шага, и главное: это заявка, её подтвердят. */
export function HowItWorks({ locale }: { locale: Locale }) {
  const t = restaurantText(locale);
  const colors = ["from-[#f4a52a] to-[#ff6a2b]", "from-[#ff6a2b] to-[#d6352b]", "from-[#17a3b0] to-[#2c9a5b]"];
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Rosette size={520} className="rest-spin pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 opacity-[0.07]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#c2410c]">{t.eyebrow}</p>
        <h2 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.2rem)] font-bold leading-[0.95] text-[#1f1712]">{t.howTitle}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {t.howSteps.map((step, i) => (
            <li
              key={step.title}
              className="motion-reveal relative overflow-hidden rounded-[2rem] border border-[#ecdcc0] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(90,40,10,0.4)]"
              data-delay={`${i * 80}`}
            >
              <span className={`bg-gradient-to-br ${colors[i]} bg-clip-text font-serif text-7xl font-bold leading-none text-transparent`}>
                0{i + 1}
              </span>
              <h3 className="mt-4 font-serif text-2xl font-bold text-[#1f1712]">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-[#6b5a4c]">{step.text}</p>
              <span className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${colors[i]}`} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Огонь и казан — единственные настоящие кадры кухни на территории, что у
 * нас есть. Фото блюд ресторана появятся после съёмки; до неё сюда нельзя
 * ставить чужие снимки еды как «наши».
 */
export function FireSection({ locale }: { locale: Locale }) {
  const t = restaurantText(locale);
  const fire = resortImages.galMangalFire;
  const kazan = resortImages.galKazanStone;
  return (
    <section className="relative overflow-hidden bg-[#140f0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,106,43,0.22),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="grid grid-cols-5 gap-3 sm:gap-4">
          <div
            className="motion-reveal col-span-3 row-span-2 aspect-[3/4] rounded-[2rem] bg-cover bg-center shadow-[0_30px_80px_-30px_rgba(255,106,43,0.55)] ring-1 ring-white/10"
            style={imageStyle(fire)}
            role="img"
            aria-label={text(fire.alt, locale)}
          />
          <div
            className="motion-reveal col-span-2 aspect-[3/4] self-end rounded-[1.6rem] bg-cover bg-center ring-1 ring-white/10"
            data-delay="120"
            style={imageStyle(kazan)}
            role="img"
            aria-label={text(kazan.alt, locale)}
          />
          <div className="col-span-2 flex items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-[#ff6a2b] to-[#d6352b] p-4 text-white/85">
            <Steam className="scale-150" />
          </div>
        </div>
        <div className="motion-reveal">
          <RestIcon name="flame" className="h-10 w-10 text-[#ff8a3d]" />
          <h2 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[0.95]">
            <span className="rest-flame-text">{t.fireTitle}</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">{t.fireText}</p>
        </div>
      </div>
    </section>
  );
}

/** Часы, телефоны, соцсети и оговорка для гостей комплекса. */
export function InfoSection({ locale, settings }: { locale: Locale; settings: RestaurantSettings }) {
  const t = restaurantText(locale);
  const phones = settings.phones.length ? settings.phones : [contacts.phone];
  const hours = settings.hoursOpen && settings.hoursClose ? `${settings.hoursOpen} – ${settings.hoursClose}` : "";
  const now = openNow(settings);
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        <div className="motion-reveal rounded-[2rem] bg-gradient-to-br from-[#f4a52a] via-[#ff6a2b] to-[#d6352b] p-7 text-white shadow-[0_30px_70px_-35px_rgba(214,53,43,0.9)]">
          <RestIcon name="clock" className="h-8 w-8" />
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/80">{t.hours}</p>
          <p className="mt-2 font-serif text-4xl font-bold">{hours || "—"}</p>
          {!hours && <p className="mt-2 text-sm text-white/85">{t.hoursUnknown}</p>}
          {now !== null && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
              <span className={`h-2 w-2 rounded-full ${now ? "rest-live bg-[#34d378]" : "bg-white/60"}`} />
              {now ? t.openNow : t.closedNow}
            </p>
          )}
        </div>

        <div className="motion-reveal rounded-[2rem] bg-[#1f1712] p-7 text-white" data-delay="80">
          <RestIcon name="phone" className="h-8 w-8 text-[#ffb35c]" />
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">{t.phone}</p>
          <div className="mt-2 space-y-1">
            {phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="block font-serif text-3xl font-bold hover:text-[#ffb35c]">
                {p}
              </a>
            ))}
          </div>
          {(settings.instagram || settings.telegram) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gradient-to-r from-[#d6352b] to-[#f4a52a] px-4 py-2 text-sm font-bold">
                  Instagram
                </a>
              )}
              {settings.telegram && (
                <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#17a3b0] px-4 py-2 text-sm font-bold">
                  Telegram
                </a>
              )}
            </div>
          )}
        </div>

        <div className="motion-reveal rounded-[2rem] border border-[#ecdcc0] bg-white p-7" data-delay="160">
          <RestIcon name="room" className="h-8 w-8 text-[#2c9a5b]" />
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#2c9a5b]">{t.roomNoteTitle}</p>
          <p className="mt-2 text-[15px] leading-7 text-[#5b4a3d]">{t.roomNote}</p>
        </div>
      </div>
    </section>
  );
}

/** Финальный призыв — меню и стол, на ярком фоне с узором. */
export function FinalCta({ locale, name, tablesOpen }: { locale: Locale; name: string; tablesOpen: boolean }) {
  const t = restaurantText(locale);
  return (
    <section className="relative overflow-hidden bg-[#140f0c] text-white">
      <IkatBand height={18} />
      <div className="relative px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_120%,rgba(255,106,43,0.5),transparent_70%)]" />
        <p className="relative font-serif text-[clamp(2.4rem,7vw,5rem)] font-bold italic leading-none">
          <span className="rest-flame-text">{name}</span>
        </p>
        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={localizePath(locale, "/restaurant/menu")}
            prefetch={false}
            className="btn-press inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-[#ffa53d] via-[#ff6a2b] to-[#d6352b] px-8 text-base font-extrabold shadow-[0_18px_40px_-14px_rgba(255,106,43,0.9)] transition hover:brightness-110"
          >
            <RestIcon name="menu" className="h-5 w-5" />
            {t.actions.menu.title}
          </Link>
          <Link
            href={localizePath(locale, "/restaurant/tables")}
            prefetch={false}
            className={`btn-press inline-flex h-14 items-center gap-2 rounded-full border border-white/25 px-8 text-base font-extrabold transition hover:bg-white/10 ${tablesOpen ? "" : "opacity-80"}`}
          >
            <RestIcon name="table" className="h-5 w-5" />
            {t.actions.tables.title}
          </Link>
        </div>
      </div>
      <IkatBand height={18} />
    </section>
  );
}

/** Шапка внутренних страниц ресторана — тёмная, с искрой, короче первого экрана. */
export function RestaurantPageHead({
  eyebrow,
  title,
  lead,
  name,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-[#140f0c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_85%_0%,rgba(255,106,43,0.45),transparent_60%),radial-gradient(60%_80%_at_0%_100%,rgba(23,163,176,0.25),transparent_60%)]" />
      <Rosette size={360} className="rest-spin pointer-events-none absolute -right-32 -top-28 -z-10 opacity-[0.14]" />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-36 lg:px-8">
        <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#ffc46b]">
          <RestIcon name="flame" className="h-3.5 w-3.5 text-[#ff8a3d]" />
          {name} · {eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.8rem,9vw,6rem)] font-bold italic leading-[0.9]">
          <span className="rest-flame-text">{title}</span>
        </h1>
        {lead && <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{lead}</p>}
        {children}
      </div>
      <IkatBand height={16} animated />
    </section>
  );
}
