"use client";

import { useMemo, useState } from "react";
import { resortImages } from "@/content/images";
import { roomCategories, rooms, type RoomCategory } from "@/content/rooms";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { list, text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

type RoomCatalogProps = {
  locale: Locale;
  limit?: number;
};

type Filter = "all" | RoomCategory;

export function RoomCatalog({ locale, limit }: RoomCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const dict = dictionaries[locale];
  const visibleRooms = useMemo(() => {
    const filtered = filter === "all" ? rooms : rooms.filter((room) => room.category === filter);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filter, limit]);

  return (
    <div>
      <div className="mb-7 flex flex-wrap gap-2">
        {roomCategories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`rounded-[6px] border px-4 py-2 text-sm font-semibold transition ${
              filter === category.id
                ? "border-[var(--green)] bg-[var(--green)] text-white"
                : "border-[color:var(--line)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setFilter(category.id as Filter)}
          >
            {text(category.label, locale)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {visibleRooms.map((room) => {
          const image = resortImages[room.image];

          return (
            <article key={room.slug} className="group overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white">
              <div className="grid min-h-full md:grid-cols-[0.95fr_1.05fr]">
                <div
                  className="min-h-72 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${image.src})` }}
                  role="img"
                  aria-label={text(image.alt, locale)}
                />
                <div className="flex flex-col p-5 sm:p-7">
                  <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{text(room.eyebrow, locale)}</p>
                  <h3 className="mt-3 font-serif text-4xl font-semibold text-[var(--ink)]">{text(room.title, locale)}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text(room.shortDescription, locale)}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[var(--ink)]">
                    <span className="rounded-[6px] bg-[var(--surface)] px-3 py-2">{text(room.capacity, locale)}</span>
                    <span className="rounded-[6px] bg-[var(--surface)] px-3 py-2">{text(room.size, locale)}</span>
                  </div>

                  <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
                    {list(room.amenities, locale).slice(0, 3).map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Icon name="check" className="h-4 w-4 text-[var(--green)]" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <p className="mb-4 text-sm font-bold text-[var(--accent-strong)]">{text(room.priceFrom, locale)}</p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ButtonLink href={localizePath(locale, `/nomera/${room.slug}`)} variant="secondary">
                        {dict.details}
                      </ButtonLink>
                      <ButtonLink href={localizePath(locale, "/bron")} variant="ghost">
                        {dict.book}
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
