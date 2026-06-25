"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { knowledge, matchKnowledge, type KnowledgeEntry } from "@/content/assistant-knowledge";
import { contacts } from "@/content/contacts";

type Locale = "ru" | "uz" | "en";

const TITLES: Record<Locale, string> = {
  ru: "Частые вопросы",
  uz: "Tez-tez beriladigan savollar",
  en: "Frequently asked questions",
};

const SUBTITLES: Record<Locale, string> = {
  ru: "CHIMGAN DARBAZA",
  uz: "CHIMGAN DARBAZA",
  en: "CHIMGAN DARBAZA",
};

const TOGGLE_LABEL: Record<Locale, string> = {
  ru: "Вопросы",
  uz: "Savollar",
  en: "FAQ",
};

const SEARCH_PLACEHOLDER: Record<Locale, string> = {
  ru: "Поиск по вопросам…",
  uz: "Savollar bo'yicha qidiruv…",
  en: "Search questions…",
};

const NO_RESULT: Record<Locale, string> = {
  ru: "Не нашли подходящий вопрос. Напишите нам — ответим лично.",
  uz: "Mos savol topilmadi. Bizga yozing — shaxsan javob beramiz.",
  en: "No matching question. Message us — we'll reply personally.",
};

const FOOTER_LABEL: Record<Locale, string> = {
  ru: "Не нашли ответ?",
  uz: "Javob topa olmadingizmi?",
  en: "Didn't find your answer?",
};

const CLOSE_LABEL: Record<Locale, string> = {
  ru: "Закрыть",
  uz: "Yopish",
  en: "Close",
};

// Order entries appear in the FAQ. Skips conversational entries (greeting, thanks).
// Excludes content that doesn't fit the current day-use positioning (cottage, glamping,
// checkin, cancellation, pool) — those topics can re-enter when overnight stays open.
const FAQ_ORDER = [
  "glamping",
  "cottage",
  "price",
  "booking",
  "checkin",
  "cancellation",
  "dayvisit",
  "schedule",
  "location",
  "parking",
  "activities",
  "restaurant",
  "kids",
  "pets",
  "winter",
  "events",
  "wifi",
  "contact",
] as const;

// Human-readable question for each entry (richer than the chip label).
const QUESTIONS: Record<string, Record<Locale, string>> = {
  glamping: {
    ru: "Что такое глэмпинг и какой он у вас?",
    uz: "Glemping nima va sizda qanday?",
    en: "What is the glamping like?",
  },
  cottage: {
    ru: "Расскажите про коттедж — для кого он?",
    uz: "Kottej haqida — u kimlar uchun?",
    en: "Tell me about the cottage — who is it for?",
  },
  checkin: {
    ru: "Во сколько заезд и выезд?",
    uz: "Kirish va chiqish soat nechada?",
    en: "What are the check-in and check-out times?",
  },
  cancellation: {
    ru: "Можно ли отменить или перенести бронь?",
    uz: "Bronni bekor qilish yoki ko'chirish mumkinmi?",
    en: "Can I cancel or reschedule a booking?",
  },
  dayvisit: {
    ru: "Можно приехать на день, без ночёвки?",
    uz: "Bir kunga, tunamasdan kelish mumkinmi?",
    en: "Can I come for a day visit without staying overnight?",
  },
  price: {
    ru: "Сколько стоит отдых у вас?",
    uz: "Sizda dam olish qancha turadi?",
    en: "How much does a visit cost?",
  },
  schedule: {
    ru: "В какие часы вы работаете?",
    uz: "Qaysi soatlarda ishlaysiz?",
    en: "What are your opening hours?",
  },
  booking: {
    ru: "Как забронировать дату?",
    uz: "Qanday sana bron qilish mumkin?",
    en: "How do I book a date?",
  },
  location: {
    ru: "Где вы находитесь и как добраться?",
    uz: "Qayerdasiz va qanday borish mumkin?",
    en: "Where are you and how do I get there?",
  },
  parking: {
    ru: "Есть ли парковка на территории?",
    uz: "Hududda avtoturargoh bormi?",
    en: "Is parking available on site?",
  },
  activities: {
    ru: "Чем заняться в течение дня?",
    uz: "Kun davomida nima qilish mumkin?",
    en: "What can I do during the day?",
  },
  restaurant: {
    ru: "Можно заказать еду на территории?",
    uz: "Hududda ovqat buyurtma qilish mumkinmi?",
    en: "Can I order food on site?",
  },
  kids: {
    ru: "Подходит ли отдых для детей?",
    uz: "Bolalar uchun mosmi?",
    en: "Is the place kid-friendly?",
  },
  pets: {
    ru: "Можно ли с домашними животными?",
    uz: "Uy hayvonlari bilan kelish mumkinmi?",
    en: "Are pets allowed?",
  },
  winter: {
    ru: "Что у вас зимой?",
    uz: "Qishda nima bor?",
    en: "What's open in winter?",
  },
  events: {
    ru: "Можно ли организовать праздник или корпоратив?",
    uz: "Bayram yoki korporativ tadbir o'tkazish mumkinmi?",
    en: "Can I host a celebration or corporate event?",
  },
  wifi: {
    ru: "Есть ли Wi-Fi на территории?",
    uz: "Hududda Wi-Fi bormi?",
    en: "Is there Wi-Fi on site?",
  },
  contact: {
    ru: "Как с вами связаться?",
    uz: "Siz bilan qanday bog'lanish mumkin?",
    en: "How can I contact you?",
  },
};

function toLocale(raw: string): Locale {
  if (raw === "uz" || raw === "en") return raw;
  return "ru";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function FaqQuestionRow({
  entry,
  locale,
  question,
  open,
  onToggle,
}: {
  entry: KnowledgeEntry;
  locale: Locale;
  question: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[color:var(--line)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface)]"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold leading-snug text-[var(--ink)]">{question}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="bg-[var(--surface)] px-4 pb-4 pt-1">
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
            {entry.answer[locale]}
          </p>
        </div>
      )}
    </div>
  );
}

export function FaqPanel({ locale: rawLocale }: { locale: string }) {
  const locale = toLocale(rawLocale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape + trap Tab focus inside the panel while open (WCAG 2.4.3).
  // On close, focus returns to the element that was focused before opening.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    // Move initial focus into the panel (search input is the natural target)
    const first = focusables()[0];
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(focusables());
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      // Wrap focus at the edges
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // List of FAQ entries with their localized question labels
  const entries = useMemo(() => {
    const items: { entry: KnowledgeEntry; question: string }[] = [];
    for (const id of FAQ_ORDER) {
      const entry = knowledge.find((k) => k.id === id);
      if (!entry) continue;
      const question = QUESTIONS[id]?.[locale];
      if (!question) continue;
      items.push({ entry, question });
    }
    return items;
  }, [locale]);

  // Filter by query (search question text + answer text + keyword match)
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return entries;
    return entries.filter(({ entry, question }) => {
      if (normalize(question).includes(q)) return true;
      if (normalize(entry.answer[locale]).includes(q)) return true;
      // Fall back to keyword matcher used elsewhere
      const matched = matchKnowledge(query);
      return matched?.id === entry.id;
    });
  }, [query, entries, locale]);

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border-t border-[color:var(--line)] bg-[var(--paper)] shadow-[0_-8px_40px_rgba(21,29,24,0.18)] sm:bottom-24 sm:left-auto sm:right-4 sm:h-[560px] sm:w-[420px] sm:rounded-3xl sm:border sm:shadow-[0_24px_80px_rgba(21,29,24,0.22)]"
          style={{ height: "min(82vh, 560px)" }}
        >
          {/* Header — text uses --paper (the contrasting pair of --ink) so it
              stays legible when the winter theme flips --ink to a light color. */}
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--line)] bg-[var(--ink)] px-5 py-4 text-[var(--paper)]">
            <div>
              <p className="font-serif text-lg font-semibold leading-tight">{TITLES[locale]}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--paper)]/55">
                {SUBTITLES[locale]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={CLOSE_LABEL[locale]}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--paper)]/70 transition-colors hover:bg-[var(--paper)]/10 hover:text-[var(--paper)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-[color:var(--line)] bg-[var(--paper)] px-4 py-3">
            <div className="flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface)] px-3.5 py-2">
              <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15.803 15.803A7.5 7.5 0 105.197 5.197a7.5 7.5 0 0010.606 10.606z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={SEARCH_PLACEHOLDER[locale]}
                className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label="Clear"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Questions list */}
          <div className="faq-scroll flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-[var(--muted)]">{NO_RESULT[locale]}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={contacts.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={contacts.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#229ED9] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Telegram
                  </a>
                </div>
              </div>
            ) : (
              filtered.map(({ entry, question }) => (
                <FaqQuestionRow
                  key={entry.id}
                  entry={entry}
                  locale={locale}
                  question={question}
                  open={activeId === entry.id}
                  onToggle={() => setActiveId((prev) => (prev === entry.id ? null : entry.id))}
                />
              ))
            )}
          </div>

          {/* Footer — contact fallback */}
          <div className="border-t border-[color:var(--line)] bg-[var(--paper)] px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {FOOTER_LABEL[locale]}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <a
                href={`tel:${contacts.phone.replaceAll(" ", "")}`}
                className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[var(--ink)] hover:border-[var(--accent)]"
              >
                {contacts.phone}
              </a>
              <a
                href={contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366]/10 px-3 py-1 text-[#128C4B] hover:bg-[#25D366]/20"
              >
                WhatsApp
              </a>
              <a
                href={contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#229ED9]/10 px-3 py-1 text-[#0088CC] hover:bg-[#229ED9]/20"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? CLOSE_LABEL[locale] : TITLES[locale]}
        className="fixed bottom-[4.5rem] right-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-[var(--sun)] pl-4 pr-5 text-[var(--on-accent)] shadow-[0_12px_32px_rgba(220,140,0,0.32)] transition-all duration-300 hover:bg-[var(--sun-dark)] hover:shadow-[0_16px_40px_rgba(220,140,0,0.40)] sm:bottom-6 sm:right-6"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--on-accent)]/10">
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </span>
        <span className="text-sm font-semibold">{TOGGLE_LABEL[locale]}</span>
      </button>
    </>
  );
}
