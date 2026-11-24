"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import {
  HERO_BACKDROP,
  HERO_FAN,
  SAZANCHIK_LOGO,
  STORY_GROUPS,
  storyAlt,
  type StoryGroup,
} from "@/content/restaurant-media";
import { MountainLine } from "./MountainLine";
import { RestIcon } from "./RestIcon";
import { StoryViewer } from "./StoryViewer";

type Props = {
  locale: Locale;
  name: string;
  /** «09:00–23:00» или пусто. */
  hours: string;
  /** Открыто ли сейчас; null — часы не заданы. */
  open: boolean | null;
  phone: string;
  announcement: string;
  /** Фото, загруженные рестораном в админке, — отдельной историей «Фото». */
  gallery: string[];
};

function tel(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Повороты и сдвиги карточек веера: левая, центральная (крупнее), правая. */
const FAN_STYLE = [
  { rot: "-8deg", from: "9rem", delay: "120ms", cls: "-left-2 top-16 w-[14rem] xl:w-[15.5rem]" },
  { rot: "1.5deg", from: "0rem", delay: "0ms", cls: "left-1/2 top-0 z-10 w-[16.5rem] -translate-x-1/2 xl:w-[18.5rem]" },
  { rot: "9deg", from: "-9rem", delay: "220ms", cls: "-right-2 top-20 w-[14rem] xl:w-[15.5rem]" },
];

/**
 * Первый экран ресторана и его «Актуальное».
 *
 * Как в Instagram ресторана: тёмный зал, свет абажуров, горы в окне, красный
 * логотип. На телефоне — кадр зала во весь экран, на компьютере — веер из
 * трёх кадров-историй справа: по нажатию открывается история целиком. Ниже —
 * кружки «Зал», «Кухня», «Завтраки», «С собой», «Снаружи» (и «Фото», если
 * ресторан загрузил свои в админке).
 */
export function RestaurantHero({ locale, name, hours, open, phone, announcement, gallery }: Props) {
  const t = restaurantText(locale);
  const [story, setStory] = useState<number | null>(null);

  const groups: StoryGroup[] = gallery.length
    ? [
        ...STORY_GROUPS,
        {
          id: "photos",
          title: { ru: t.gallery.title, uz: t.gallery.title, en: t.gallery.title },
          cover: gallery[0],
          frames: gallery.map((src, i) => ({
            src,
            alt: { ru: `${name} — фото ${i + 1}`, uz: `${name} — ${i + 1}-surat`, en: `${name} — photo ${i + 1}` },
          })),
        },
      ]
    : STORY_GROUPS;
  const openGroup = (id: string) => setStory(Math.max(0, groups.findIndex((gr) => gr.id === id)));

  return (
    <>
      <section className="relative isolate -mt-[4.5rem] flex min-h-[94svh] flex-col overflow-hidden lg:min-h-0">
        {/* Телефон и планшет: зал с окнами на горы во весь экран. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_BACKDROP.src}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover lg:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--sz-walnut)]/75 via-[var(--sz-walnut)]/25 to-[var(--sz-walnut)] lg:hidden"
        />
        <div aria-hidden className="sz-glow absolute inset-0 -z-10 hidden lg:block" />

        <div className="mx-auto grid w-full max-w-7xl flex-1 items-end px-4 pb-8 pt-28 sm:px-6 lg:min-h-[42rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-8 lg:pb-6 lg:pt-32">
          <div className="min-w-0 max-w-xl">
            <h1>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SAZANCHIK_LOGO}
                alt={name}
                width={687}
                height={225}
                className="h-auto w-[16.5rem] drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] min-[400px]:w-[19rem] sm:w-[23rem] lg:w-[26rem]"
              />
            </h1>
            <MountainLine className="mt-6 h-4 w-40 text-[var(--sz-lamp)]" />
            <p className="mt-4 font-serif text-[2.2rem] font-semibold italic leading-[1.04] tracking-[-0.01em] text-[var(--sz-snow)] min-[400px]:text-[2.55rem] sm:text-6xl lg:text-[4.1rem]">
              {t.look.headline}
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--sz-snow)]/80 sm:text-base">{t.look.lead}</p>

            {(hours || announcement) && (
              <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
                {hours && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3.5 py-1.5 text-[var(--sz-snow)]/90 backdrop-blur-sm">
                    {open !== null && (
                      <span className={`h-2 w-2 rounded-full ${open ? "bg-[#4cc38a]" : "bg-[var(--sz-stone)]"}`} />
                    )}
                    {open === null ? t.hours : open ? t.openNow : t.closedNow}, {hours}
                  </span>
                )}
                {announcement && (
                  <span className="inline-flex items-center rounded-full bg-[var(--sz-lamp)]/15 px-3.5 py-1.5 font-semibold text-[var(--sz-lamp)]">
                    {announcement}
                  </span>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#menu"
                className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-[var(--sz-lamp)] px-6 text-[15px] font-bold text-[#2a1a08] shadow-[0_12px_30px_-12px_rgba(233,169,79,0.9)] transition-colors hover:bg-[#f2b865]"
              >
                <RestIcon name="menu" className="h-[18px] w-[18px]" />
                {t.look.openMenu}
              </a>
              <a
                href={tel(phone)}
                className="btn-press inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-black/20 px-5 text-[15px] font-semibold text-[var(--sz-snow)] backdrop-blur-sm transition-colors hover:border-[var(--sz-lamp)]"
              >
                <RestIcon name="phone" className="h-4 w-4" />
                {t.call}
              </a>
            </div>
          </div>

          {/* Компьютер: веер историй. Каждая карточка открывает свою историю. */}
          <div className="sz-fan relative hidden h-[36rem] lg:block">
            {HERO_FAN.map(({ frame, group }, i) => {
              const s = FAN_STYLE[i];
              const title = groups.find((gr) => gr.id === group)?.title[locale] ?? "";
              return (
                <div
                  key={frame.src}
                  className={`absolute ${s.cls}`}
                  style={{ "--sz-rot": s.rot, "--sz-from-x": s.from, "--sz-delay": s.delay } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => openGroup(group)}
                    aria-label={t.look.openStory(title)}
                    className="group relative block w-full overflow-hidden rounded-[1.6rem] bg-[var(--sz-walnut-2)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition-transform duration-500 hover:-translate-y-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.src}
                      alt={storyAlt(frame, locale)}
                      className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-left text-sm font-semibold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                        <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden>
                          <path d="M8 5.5v13l11-6.5z" />
                        </svg>
                      </span>
                      {title}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* «Актуальное». */}
        <nav aria-label={t.look.stories} className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-10">
          <ul className="rest-chips -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:gap-6 sm:px-0">
            {groups.map((gr, i) => (
              <li key={gr.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setStory(i)}
                  aria-label={t.look.openStory(gr.title[locale])}
                  className="group flex w-[4.75rem] flex-col items-center gap-2 sm:w-[5.5rem]"
                >
                  <span className="sz-ring rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gr.cover}
                      alt=""
                      loading="lazy"
                      className="block h-[4.25rem] w-[4.25rem] rounded-full border-[3px] border-[var(--sz-walnut)] object-cover sm:h-[5rem] sm:w-[5rem]"
                    />
                  </span>
                  <span className="max-w-full truncate text-[12.5px] font-medium text-[var(--sz-snow)]/85">{gr.title[locale]}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {story !== null && <StoryViewer groups={groups} start={story} locale={locale} onClose={() => setStory(null)} />}
    </>
  );
}
