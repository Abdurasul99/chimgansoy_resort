import { menuCopy, menuGroups, type MenuIcon } from "@/content/menu";
import { contacts } from "@/content/contacts";
import { text } from "@/lib/localize";
import type { Locale } from "@/i18n/config";

/**
 * Inline SVGs rather than an icon set.
 *
 * Seven marks used once each on one page is not worth a dependency or a sprite
 * request, and drawing them here keeps them on the brand's stroke weight.
 */
function GroupIcon({ name }: { name: MenuIcon }) {
  const common = {
    className: "h-6 w-6",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "pizza":
      return (
        <svg {...common}>
          <path d="M12 3 3.5 19.5a1 1 0 0 0 1.3 1.35L21 13Z" />
          <circle cx="11" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "burger":
      return (
        <svg {...common}>
          <path d="M3.5 8.5c0-2.5 3.8-4.5 8.5-4.5s8.5 2 8.5 4.5" />
          <path d="M3 12h18" />
          <path d="M3.5 15.5h17" />
          <path d="M3.5 15.5c0 2.5 3.8 4.5 8.5 4.5s8.5-2 8.5-4.5" />
        </svg>
      );
    case "sandwich":
      return (
        <svg {...common}>
          <path d="M3 9.5 12 5l9 4.5-9 4.5Z" />
          <path d="M3.5 13 12 17l8.5-4" />
          <path d="M4 16.5 12 20l8-3.5" />
        </svg>
      );
    case "hotdog":
      return (
        <svg {...common}>
          <path d="M5 16.5C3 14.5 3.5 10 7 7s8-3.5 10-1.5 1.5 6.5-1.5 9.5-8.5 4.5-10.5 1.5Z" />
          <path d="M8 14c1-2 2.5-3.5 4.5-4.5" />
        </svg>
      );
    case "snack":
      return (
        <svg {...common}>
          <path d="M6 20h12l1.2-9H4.8Z" />
          <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
        </svg>
      );
    case "side":
      return (
        <svg {...common}>
          <path d="M7 21V9M12 21V6M17 21V10" />
          <path d="M4.5 21h15" />
        </svg>
      );
    case "salad":
      return (
        <svg {...common}>
          <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" />
          <path d="M12 11c-1-3 .5-5.5 3-6.5" />
          <path d="M9.5 11C8 9 8.5 6.5 10 5.5" />
        </svg>
      );
  }
}

/**
 * The kitchen menu — dishes only, no prices.
 *
 * See content/menu.ts for why: a price here is a price that goes stale the
 * moment the kitchen changes it and nobody but a developer can fix it.
 */
export function MenuBoard({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="motion-reveal max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            {text(menuCopy.eyebrow, locale)}
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-tight text-[var(--ink)]">
            {text(menuCopy.title, locale)}
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">{text(menuCopy.lead, locale)}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menuGroups.map((g, i) => (
            <div
              key={g.key}
              className="motion-reveal rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-6"
              data-delay={`${Math.min(i, 5) * 60}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent-strong)]">
                  <GroupIcon name={g.icon} />
                </span>
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  {text(g.title, locale)}
                </h3>
              </div>
              <ul className="mt-4 space-y-2">
                {g.items.map((item) => (
                  <li
                    key={text(item, "ru")}
                    className="flex items-start gap-2.5 text-sm leading-6 text-[var(--muted)]"
                  >
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {text(item, locale)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="motion-reveal mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
          {text(menuCopy.priceNote, locale)}
          <a
            href={`tel:${contacts.phone.replaceAll(" ", "")}`}
            className="font-bold text-[var(--forest-dark)] hover:text-[var(--accent-strong)]"
          >
            {contacts.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
