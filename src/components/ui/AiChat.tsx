"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { contacts } from "@/content/contacts";

type Locale = "ru" | "uz" | "en";
type Msg = { role: "user" | "assistant"; content: string };

// ── clickable links in assistant answers ─────────────────────────────────────
// The model emits Markdown [text](url) (see ССЫЛКИ in ai-context.ts); we also
// linkify bare URLs. Only http(s), tel:, mailto: and internal /paths become
// links — anything else stays plain text.

const MD_LINK = /\[([^\]\n]{1,80})\]\(([^)\s]{1,300})\)/g;
const BARE_URL = /https?:\/\/[^\s<>"')\]]+/g;

function safeHref(url: string): string | null {
  if (/^https?:\/\//i.test(url) || /^(tel:|mailto:)/i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return null;
}

function AnswerLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-semibold text-[var(--accent-strong)] underline decoration-[var(--accent)]/40 underline-offset-2 transition-colors hover:decoration-[var(--accent-strong)]"
    >
      {children}
    </a>
  );
}

function linkifyBare(chunk: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of chunk.matchAll(BARE_URL)) {
    const i = m.index ?? 0;
    if (i > last) out.push(chunk.slice(last, i));
    const url = m[0].replace(/[.,;:!?]+$/, ""); // keep trailing punctuation as text
    out.push(
      <AnswerLink key={`${keyBase}u${n++}`} href={url}>
        {url.replace(/^https?:\/\//, "")}
      </AnswerLink>,
    );
    if (url.length < m[0].length) out.push(m[0].slice(url.length));
    last = i + m[0].length;
  }
  if (last < chunk.length) out.push(chunk.slice(last));
  return out;
}

/** Assistant text → text + clickable links (Markdown links first, then bare URLs). */
function richText(raw: string): ReactNode[] {
  // Small models occasionally emit **bold** despite instructions — show clean text.
  const text = raw.replace(/\*\*([^*]*)\*\*/g, "$1");
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(MD_LINK)) {
    const [full, label, url] = m;
    const i = m.index ?? 0;
    if (i > last) out.push(...linkifyBare(text.slice(last, i), `s${n}`));
    const href = safeHref(url);
    out.push(href ? <AnswerLink key={`md${n}`} href={href}>{label}</AnswerLink> : full);
    last = i + full.length;
    n++;
  }
  if (last < text.length) out.push(...linkifyBare(text.slice(last), `t${n}`));
  return out;
}

const COPY: Record<
  Locale,
  { greeting: string; placeholder: string; error: string; thinking: string; disclaimer: string; send: string }
> = {
  ru: {
    greeting:
      "Здравствуйте! Я помощник CHIMGAN DARBAZA. Спрошу — отвечу про отдых, цены, бронирование и как добраться. Чем помочь?",
    placeholder: "Спросите что угодно…",
    error: "Не получилось ответить. Напишите нам напрямую:",
    thinking: "Печатает…",
    disclaimer: "ИИ может ошибаться · точную информацию подтвердит администратор",
    send: "Отправить",
  },
  uz: {
    greeting:
      "Assalomu alaykum! Men CHIMGAN DARBAZA yordamchisiman. Dam olish, narxlar, bron va yo'l haqida so'rang. Nima bilan yordam beray?",
    placeholder: "Istalgan narsani so'rang…",
    error: "Javob berib bo'lmadi. Bizga to'g'ridan-to'g'ri yozing:",
    thinking: "Yozmoqda…",
    disclaimer: "AI xato qilishi mumkin · aniq ma'lumotni administrator tasdiqlaydi",
    send: "Yuborish",
  },
  en: {
    greeting:
      "Hi! I'm the CHIMGAN DARBAZA assistant. Ask me about the visit, prices, booking, or how to get here. How can I help?",
    placeholder: "Ask anything…",
    error: "Couldn't answer just now. Message us directly:",
    thinking: "Typing…",
    disclaimer: "AI can make mistakes · the administrator confirms exact details",
    send: "Send",
  },
};

const LANG_CHIPS: { code: Locale; label: string }[] = [
  { code: "ru", label: "Рус" },
  { code: "uz", label: "O'zb" },
  { code: "en", label: "Eng" },
];

const ANY_LANG_NOTE: Record<Locale, string> = {
  ru: "или пишите на любом языке",
  uz: "yoki istalgan tilda yozing",
  en: "or write in any language",
};

export function AiChat({ locale }: { locale: Locale }) {
  const [lang, setLang] = useState<Locale>(locale);
  const t = COPY[lang];
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: COPY[locale].greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function switchLang(next: Locale) {
    if (next === lang) return;
    setLang(next);
    // Before the guest has written anything, restart the greeting in the new language.
    setMessages((m) =>
      m.some((x) => x.role === "user") ? m : [{ role: "assistant", content: COPY[next].greeting }],
    );
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(false);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Drop the opening greeting (UI-only) from what we send to the model.
        body: JSON.stringify({ messages: next.slice(1), locale: lang }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string } | null;
      if (!res.ok || !data?.reply) throw new Error("failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation language picker */}
      <div className="flex items-center gap-1.5 border-b border-[color:var(--line)] bg-[var(--paper)] px-4 py-2">
        <svg
          className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.2 4-5.4 4-9s-1.5-6.8-4-9c-2.5 2.2-4 5.4-4 9s1.5 6.8 4 9zM3.5 9h17M3.5 15h17"
          />
        </svg>
        {LANG_CHIPS.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => switchLang(c.code)}
            aria-pressed={lang === c.code}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              lang === c.code
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="ml-auto truncate text-[10px] text-[var(--muted)]">{ANY_LANG_NOTE[lang]}</span>
      </div>

      {/* Messages */}
      <div ref={listRef} className="faq-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--sun)] text-[var(--on-accent)]"
                  : "bg-[var(--surface)] text-[var(--ink)]"
              }`}
            >
              {m.role === "assistant" ? richText(m.content) : m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[var(--surface)] px-3.5 py-2.5 text-sm italic text-[var(--muted)]">
              {t.thinking}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] px-3.5 py-3 text-sm text-[var(--muted)]">
            <p>{t.error}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <a href={`tel:${contacts.phone.replaceAll(" ", "")}`} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[var(--ink)] hover:border-[var(--accent)]">
                {contacts.phone}
              </a>
              <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366]/10 px-3 py-1 text-[#128C4B] hover:bg-[#25D366]/20">
                WhatsApp
              </a>
              <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#229ED9]/10 px-3 py-1 text-[#0088CC] hover:bg-[#229ED9]/20">
                Telegram
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[color:var(--line)] bg-[var(--paper)] px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={t.placeholder}
            className="max-h-28 flex-1 resize-none rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            aria-label={t.send}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-[var(--on-accent)] transition hover:bg-[var(--sun-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-2 px-1 text-[10px] leading-tight text-[var(--muted)]">{t.disclaimer}</p>
      </div>
    </div>
  );
}
