"use client";

import { useEffect, useRef, useState } from "react";
import {
  matchKnowledge,
  findById,
  quickReplies,
  fallback,
} from "@/content/assistant-knowledge";

type Locale = "ru" | "uz" | "en";
type Message = { role: "user" | "assistant"; content: string };

const GREETINGS: Record<Locale, string> = {
  ru: "Привет! 👋 Я помощник курорта CHIMGAN DARBAZA 🏔️\nОтвечу на частые вопросы про номера, бронирование, активности и контакты. Выберите тему ниже или напишите свой вопрос.",
  uz: "Salom! 👋 Men CHIMGAN DARBAZA kurortining yordamchisiman 🏔️\nXonalar, bron qilish, faoliyatlar va aloqalar bo'yicha tez-tez beriladigan savollarga javob beraman. Quyidan mavzu tanlang yoki savol yozing.",
  en: "Hi! 👋 I'm the CHIMGAN DARBAZA resort assistant 🏔️\nI answer common questions about rooms, bookings, activities, and contacts. Pick a topic below or ask your own question.",
};

const PLACEHOLDERS: Record<Locale, string> = {
  ru: "Напишите вопрос...",
  uz: "Savol yozing...",
  en: "Ask a question...",
};

const TITLES: Record<Locale, string> = {
  ru: "Помощник курорта",
  uz: "Kurort yordamchisi",
  en: "Resort Assistant",
};

const LABELS: Record<Locale, string> = {
  ru: "Помощник",
  uz: "Yordamchi",
  en: "Assistant",
};

const SUGGEST_LABELS: Record<Locale, string> = {
  ru: "Популярные вопросы",
  uz: "Mashhur savollar",
  en: "Popular questions",
};

function toLocale(raw: string): Locale {
  if (raw === "uz" || raw === "en") return raw;
  return "ru";
}

export function AiAssistant({ locale: rawLocale }: { locale: string }) {
  const locale = toLocale(rawLocale);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETINGS[locale] },
  ]);
  const [input, setInput] = useState("");
  const [showIntro, setShowIntro] = useState(false);
  const [ready, setReady] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [starEnd, setStarEnd] = useState({ x: "800px", y: "500px" });
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setIsNight(h < 6 || h >= 20);

    setStarEnd({
      x: `${window.innerWidth - 90}px`,
      y: `${window.innerHeight - 60}px`,
    });

    if (!localStorage.getItem("cgs_v")) {
      localStorage.setItem("cgs_v", "1");
      const t1 = setTimeout(() => setShowIntro(true), 700);
      const t2 = setTimeout(() => { setShowIntro(false); setReady(true); }, 2400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  function appendAndAnswer(userText: string, answerText: string) {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: answerText },
    ]);
    setShowQuickReplies(false);
  }

  function handleSend() {
    const txt = input.trim();
    if (!txt) return;
    const match = matchKnowledge(txt);
    const answer = match ? match.answer[locale] : fallback[locale];
    appendAndAnswer(txt, answer);
    setInput("");
  }

  function handleQuickReply(id: string, label: string) {
    const entry = findById(id);
    if (!entry) return;
    appendAndAnswer(label, entry.answer[locale]);
  }

  const chips = quickReplies[locale];

  const mode = isNight ? "night" : "day";
  const headerBg = isNight
    ? "radial-gradient(circle at 30% 30%, #2a1a5e, #0d0820)"
    : "linear-gradient(135deg, #FFD000 0%, #FF8C00 60%, #FF5500 100%)";

  return (
    <>
      {/* Shooting comet — first visit only */}
      {showIntro && (
        <div
          className="assistant-intro"
          style={{
            "--assistant-star-end-x": starEnd.x,
            "--assistant-star-end-y": starEnd.y,
          } as React.CSSProperties}
        >
          <div className="assistant-intro__trail" />
          <div className="assistant-intro__head" />
          <div className="assistant-intro__burst" style={{ right: "5rem", bottom: "4rem" }} />
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-[color:var(--line)] bg-[var(--paper)] shadow-[0_-8px_40px_rgba(21,29,24,0.20)] sm:bottom-24 sm:left-auto sm:right-4 sm:h-[540px] sm:w-[400px] sm:rounded-2xl sm:border sm:shadow-[0_24px_80px_rgba(21,29,24,0.25)]"
          style={{ height: "min(80vh,540px)" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: headerBg }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                {isNight ? (
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <g style={{ animation: "assistant-spin 12s linear infinite", transformOrigin: "12px 12px" }} stroke="white" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
                      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                      <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" /><line x1="6.34" y1="17.66" x2="4.22" y2="19.78" />
                    </g>
                    <circle cx="12" cy="12" r="4" fill="white" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{TITLES[locale]}</p>
                <p className="text-[10px] text-white/60">CHIMGAN DARBAZA</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-white font-bold" style={{ background: headerBg }}>
                    {isNight ? "🌙" : "☀"}
                  </div>
                )}
                <div
                  className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "text-white rounded-br-sm" : "bg-[var(--surface)] text-[var(--ink)] rounded-bl-sm border border-[color:var(--line)]"}`}
                  style={m.role === "user" ? { background: headerBg } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {showQuickReplies && (
              <div className="pt-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {SUGGEST_LABELS[locale]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => handleQuickReply(chip.id, chip.label)}
                      className="rounded-full border border-[color:var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-all hover:border-[var(--sun)] hover:bg-[var(--surface)] hover:text-[var(--sun-dark)]"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[color:var(--line)] bg-[var(--paper)] px-3 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={PLACEHOLDERS[locale]}
                className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: headerBg }}
                aria-label="Send"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[9px] text-[var(--muted)]">CHIMGAN DARBAZA</p>
          </div>
        </div>
      )}

      {/* Magic toggle — Moon or Sun */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={[
          "assistant-toggle",
          `assistant-toggle--${mode}`,
          ready ? "assistant-toggle--ready" : "",
          open ? "assistant-toggle--open" : "",
        ].join(" ")}
      >
        <div className="assistant-toggle__orb">
          <div className={`assistant-toggle__halo assistant-toggle__halo--${mode}`} />
          <div className={`assistant-toggle__celestial assistant-toggle__celestial--${mode}`}>
            {isNight && (
              <>
                <span className="assistant-toggle__crater assistant-toggle__crater--one" />
                <span className="assistant-toggle__crater assistant-toggle__crater--two" />
                <span className="assistant-toggle__crater assistant-toggle__crater--three" />
              </>
            )}
            <div className="assistant-toggle__glyph">
              {open ? (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>
        <span className="assistant-toggle__copy">
          <span className="assistant-toggle__label">{LABELS[locale]}</span>
        </span>
        <span className="assistant-toggle__spark assistant-toggle__spark--three" />
      </button>
    </>
  );
}
