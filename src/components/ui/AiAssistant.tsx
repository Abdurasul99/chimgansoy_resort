"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Message = { role: "user" | "assistant"; content: string };
type CelestialMode = "day" | "night";
type IntroStyle = CSSProperties & {
  "--assistant-star-end-x"?: string;
  "--assistant-star-end-y"?: string;
};

const INTRO_STORAGE_KEY = "chimgansoy-assistant-intro";

const GREETINGS: Record<string, string> = {
  ru: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u042f \u043a\u043e\u043d\u0441\u044c\u0435\u0440\u0436 CHIMGANSOY. \u041f\u043e\u043c\u043e\u0433\u0443 \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u043d\u043e\u043c\u0435\u0440, \u043f\u043e\u0434\u0441\u043a\u0430\u0436\u0443 \u043f\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044f\u043c \u0438 \u043e\u0442\u0432\u0435\u0447\u0443 \u043d\u0430 \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u043e \u0432\u0430\u0448\u0435\u043c \u043e\u0442\u0434\u044b\u0445\u0435.",
  uz: "Salom! Men CHIMGANSOY konsyerjiman. Xona tanlashda, faoliyatlar bo'yicha yoki dam olish haqidagi savollarda yordam beraman.",
  en: "Hello! I'm the CHIMGANSOY concierge. I can help you choose a room, suggest activities, and answer questions about your stay.",
};

const PLACEHOLDERS: Record<string, string> = {
  ru: "\u0421\u043f\u0440\u043e\u0441\u0438\u0442\u0435 \u043f\u0440\u043e \u043d\u043e\u043c\u0435\u0440, \u0431\u0430\u043d\u044e \u0438\u043b\u0438 \u0442\u0440\u0430\u043d\u0441\u0444\u0435\u0440...",
  uz: "Xona, sauna yoki transfer haqida so'rang...",
  en: "Ask about rooms, the spa, or transfers...",
};

const TITLES: Record<string, string> = {
  ru: "\u041a\u043e\u043d\u0441\u044c\u0435\u0440\u0436 \u043a\u0443\u0440\u043e\u0440\u0442\u0430",
  uz: "Kurort konsyerji",
  en: "Resort concierge",
};

const BUTTON_LABELS: Record<string, string> = {
  ru: "\u041a\u043e\u043d\u0441\u044c\u0435\u0440\u0436",
  uz: "Konsyerj",
  en: "Concierge",
};

const OPEN_ARIA_LABELS: Record<string, string> = {
  ru: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043a\u043e\u043d\u0441\u044c\u0435\u0440\u0436\u0430",
  uz: "Konsyerjni ochish",
  en: "Open concierge",
};

const CLOSE_ARIA_LABELS: Record<string, string> = {
  ru: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043a\u043e\u043d\u0441\u044c\u0435\u0440\u0436\u0430",
  uz: "Konsyerjni yopish",
  en: "Close concierge",
};

const SEND_ARIA_LABELS: Record<string, string> = {
  ru: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
  uz: "Xabar yuborish",
  en: "Send message",
};

const STATUS_LINES: Record<string, Record<CelestialMode, string>> = {
  ru: {
    day: "\u0421\u043e\u043b\u043d\u0435\u0447\u043d\u044b\u0439 \u043a\u043e\u043d\u0441\u044c\u0435\u0440\u0436 CHIMGANSOY",
    night: "\u041b\u0443\u043d\u043d\u044b\u0439 \u043a\u043e\u043d\u0441\u044c\u0435\u0440\u0436 CHIMGANSOY",
  },
  uz: {
    day: "Quyoshli konsyerj CHIMGANSOY",
    night: "Oyli konsyerj CHIMGANSOY",
  },
  en: {
    day: "Sun concierge CHIMGANSOY",
    night: "Moon concierge CHIMGANSOY",
  },
};

const HINT_LINES: Record<string, string> = {
  ru: "\u041c\u043e\u0436\u043d\u043e \u0441\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u043f\u0440\u043e \u043d\u043e\u043c\u0435\u0440\u0430, \u0440\u0435\u0441\u0442\u043e\u0440\u0430\u043d, \u0431\u0430\u043d\u044e \u0438\u043b\u0438 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438.",
  uz: "Xonalar, restoran, sauna yoki faoliyatlar haqida so'rashingiz mumkin.",
  en: "Ask about rooms, dining, the spa, or activities.",
};

const ERROR_MESSAGES: Record<string, string> = {
  ru: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  uz: "Javob berib bo'lmadi. Iltimos, yana urinib ko'ring.",
  en: "I couldn't answer just now. Please try again.",
};

function getText(locale: string, dictionary: Record<string, string>) {
  return dictionary[locale] ?? dictionary.ru;
}

function getModeLabel(locale: string, mode: CelestialMode) {
  return STATUS_LINES[locale]?.[mode] ?? STATUS_LINES.ru[mode];
}

function getCelestialMode(date = new Date()): CelestialMode {
  const hour = date.getHours();
  return hour >= 6 && hour < 19 ? "day" : "night";
}

function AssistantGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function CelestialOrb({ mode }: { mode: CelestialMode }) {
  return (
    <span className="assistant-toggle__orb" aria-hidden="true">
      <span className={`assistant-toggle__halo assistant-toggle__halo--${mode}`} />
      <span className={`assistant-toggle__celestial assistant-toggle__celestial--${mode}`}>
        {mode === "night" ? (
          <>
            <span className="assistant-toggle__crater assistant-toggle__crater--one" />
            <span className="assistant-toggle__crater assistant-toggle__crater--two" />
            <span className="assistant-toggle__crater assistant-toggle__crater--three" />
          </>
        ) : null}
        <span className="assistant-toggle__glyph">
          <AssistantGlyph />
        </span>
      </span>
    </span>
  );
}

export function AiAssistant({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CelestialMode>("day");
  const [buttonReady, setButtonReady] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [introStyle, setIntroStyle] = useState<IntroStyle | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: getText(locale, GREETINGS) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    const syncMode = () => setMode(getCelestialMode());
    syncMode();

    const intervalId = window.setInterval(syncMode, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let frameId = 0;
    let activateId = 0;
    let revealId = 0;
    let cleanupId = 0;

    const startIntro = () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hasSeenIntro = sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";

      if (reduceMotion || hasSeenIntro) {
        setButtonReady(true);
        return;
      }

      const rect = toggleRef.current?.getBoundingClientRect();

      if (!rect) {
        setButtonReady(true);
        return;
      }

      setIntroStyle({
        "--assistant-star-end-x": `${rect.left + 36}px`,
        "--assistant-star-end-y": `${rect.top + rect.height / 2 - 6}px`,
      });
      setIntroActive(true);

      revealId = window.setTimeout(() => {
        setButtonReady(true);
      }, 1180);

      cleanupId = window.setTimeout(() => {
        sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
        setIntroActive(false);
      }, 1700);
    };

    frameId = window.requestAnimationFrame(() => {
      activateId = window.setTimeout(startIntro, 80);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(activateId);
      window.clearTimeout(revealId);
      window.clearTimeout(cleanupId);
    };
  }, []);

  async function send() {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            break;
          }

          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content ?? "";

            if (!delta) {
              continue;
            }

            full += delta;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: full };
              return next;
            });
          } catch {
            continue;
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: getText(locale, ERROR_MESSAGES),
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  const title = getText(locale, TITLES);
  const label = getText(locale, BUTTON_LABELS);
  const placeholder = getText(locale, PLACEHOLDERS);
  const hint = getText(locale, HINT_LINES);
  const status = getModeLabel(locale, mode);
  const openAriaLabel = getText(locale, OPEN_ARIA_LABELS);
  const closeAriaLabel = getText(locale, CLOSE_ARIA_LABELS);
  const sendAriaLabel = getText(locale, SEND_ARIA_LABELS);
  const isNight = mode === "night";

  return (
    <>
      {introActive ? (
        <div className="assistant-intro" style={introStyle} aria-hidden="true">
          <span className="assistant-intro__trail" />
          <span className="assistant-intro__head" />
          <span className="assistant-intro__burst" />
        </div>
      ) : null}

      {open ? (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-[1.75rem] border-t backdrop-blur-xl sm:bottom-24 sm:left-auto sm:right-5 sm:h-[520px] sm:w-[390px] sm:rounded-[1.75rem] sm:border ${
            isNight
              ? "border-white/10 bg-[linear-gradient(180deg,rgba(8,14,27,0.98)_0%,rgba(13,20,30,0.98)_54%,rgba(12,22,17,0.98)_100%)] shadow-[0_28px_90px_rgba(3,8,20,0.55)]"
              : "border-[rgba(181,99,64,0.18)] bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(249,241,224,0.98)_60%,rgba(244,235,214,0.98)_100%)] shadow-[0_28px_90px_rgba(92,58,19,0.18)]"
          }`}
          style={{ height: "min(74vh, 520px)" }}
        >
          <div
            className={`relative flex items-center justify-between overflow-hidden px-4 py-3.5 ${
              isNight
                ? "border-b border-white/10 bg-[linear-gradient(135deg,rgba(17,28,49,0.98)_0%,rgba(34,55,94,0.96)_45%,rgba(17,39,31,0.94)_100%)] text-white"
                : "border-b border-[rgba(181,99,64,0.14)] bg-[linear-gradient(135deg,rgba(110,61,23,0.96)_0%,rgba(190,120,40,0.92)_48%,rgba(243,185,83,0.88)_100%)] text-white"
            }`}
          >
            <span className="assistant-panel__spark assistant-panel__spark--one" />
            <span className="assistant-panel__spark assistant-panel__spark--two" />
            <span className="assistant-panel__spark assistant-panel__spark--three" />

            <div className="relative flex items-center gap-3">
              <CelestialOrb mode={mode} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-white/70">{status}</p>
                <p className="text-sm font-bold text-white">{title}</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/75 transition-colors duration-300 hover:bg-white/14 hover:text-white"
              aria-label={closeAriaLabel}
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" ? (
                    <div
                      className={`mr-2 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold ${
                        isNight
                          ? "border-white/10 bg-[linear-gradient(135deg,#f5f0df_0%,#b2bfdc_100%)] text-[#22304f]"
                          : "border-[rgba(129,77,23,0.15)] bg-[linear-gradient(135deg,#fff4bc_0%,#eea33b_100%)] text-[#6c360d]"
                      }`}
                    >
                      C
                    </div>
                  ) : null}

                  <div
                    className={`max-w-[82%] rounded-[1.35rem] px-3.5 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? isNight
                          ? "rounded-br-md bg-[linear-gradient(135deg,rgba(83,120,255,0.92)_0%,rgba(70,189,157,0.88)_100%)] text-white shadow-[0_12px_28px_rgba(46,88,180,0.32)]"
                          : "rounded-br-md bg-[linear-gradient(135deg,rgba(166,100,38,0.95)_0%,rgba(215,154,74,0.92)_100%)] text-white shadow-[0_12px_28px_rgba(166,100,38,0.24)]"
                        : isNight
                          ? "rounded-bl-md border border-white/8 bg-white/6 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                          : "rounded-bl-md border border-[color:var(--line)] bg-white/82 text-[var(--ink)] shadow-[0_10px_30px_rgba(116,89,42,0.08)]"
                    }`}
                  >
                    {message.content ? (
                      message.content
                    ) : (
                      <span className="flex h-4 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div
            className={`border-t px-3 py-3 ${
              isNight ? "border-white/10 bg-white/4" : "border-[color:var(--line)] bg-white/55"
            }`}
          >
            <div
              className={`flex items-center gap-2 rounded-[1.15rem] border px-3 py-2.5 ${
                isNight
                  ? "border-white/10 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border-[color:var(--line)] bg-white/80 shadow-[0_10px_26px_rgba(116,89,42,0.08)]"
              }`}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    send();
                  }
                }}
                placeholder={placeholder}
                disabled={loading}
                className={`flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50 ${
                  isNight ? "text-white placeholder:text-white/38" : "text-[var(--ink)] placeholder:text-[var(--muted)]"
                }`}
              />

              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-35 ${
                  isNight
                    ? "bg-[linear-gradient(135deg,#6f95ff_0%,#4cc6a6_100%)] shadow-[0_14px_32px_rgba(76,143,255,0.32)] hover:scale-105 hover:shadow-[0_18px_36px_rgba(76,143,255,0.42)]"
                    : "bg-[linear-gradient(135deg,#c37733_0%,#efb75b_100%)] shadow-[0_14px_32px_rgba(195,119,51,0.24)] hover:scale-105 hover:shadow-[0_18px_36px_rgba(195,119,51,0.34)]"
                }`}
                aria-label={sendAriaLabel}
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>

            <p className={`mt-2 text-center text-[11px] ${isNight ? "text-white/45" : "text-[var(--muted)]"}`}>{hint}</p>
          </div>
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? closeAriaLabel : openAriaLabel}
        className={`assistant-toggle assistant-toggle--${mode} ${buttonReady ? "assistant-toggle--ready" : ""} ${
          open ? "assistant-toggle--open" : ""
        }`}
      >
        <span className="assistant-toggle__spark assistant-toggle__spark--three" />
        <CelestialOrb mode={mode} />
        <span className="assistant-toggle__copy">
          <span className="assistant-toggle__label">{label}</span>
        </span>
      </button>
    </>
  );
}
