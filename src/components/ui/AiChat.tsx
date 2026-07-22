"use client";

import { useEffect, useRef, useState } from "react";
import { contacts } from "@/content/contacts";

type Locale = "ru" | "uz" | "en";
type Msg = { role: "user" | "assistant"; content: string };

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

export function AiChat({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: t.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ messages: next.slice(1), locale }),
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
              {m.content}
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
