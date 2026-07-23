/**
 * AI layer of the staff Telegram bot.
 *
 * Free-text staff questions go to Groq (openai/gpt-oss-20b, same stack as the
 * site concierge in app/api/chat) with PMS tools. The model decides which live
 * Exely data it needs, we execute the calls, and it answers in plain text.
 * Stateless: optional context is only the message the staffer replied to.
 */

import {
  getAvailability,
  getBookingsInPeriod,
  getFinance,
  getGuestFlow,
  roomTypeName,
} from "./exely-pms";
import { checkAvailability } from "./exely";
import { venueFacts } from "./venue-facts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

type ToolCall = { id: string; function: { name: string; arguments: string } };
type GroqMsg = {
  role: string;
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};
type GroqResponse = { choices?: Array<{ message?: GroqMsg }> };

// ── tools ─────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "pms_availability",
      description:
        "Шахматка PMS: сколько номеров свободно/занято по типам (Глэмпинг, Шале) на конкретную дату.",
      parameters: {
        type: "object",
        properties: { date: { type: "string", description: "Дата YYYY-MM-DD" } },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pms_bookings",
      description:
        "Список броней PMS, чьё проживание пересекает период: номер брони, гость, телефон, тип номера, заезд/выезд, статус, сумма. Для вопросов «кто живёт/заезжает/выезжает».",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Начало периода YYYY-MM-DD" },
          to: { type: "string", description: "Конец периода YYYY-MM-DD" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pms_finance",
      description:
        "Деньги (платежи) из PMS за период: поступления, возвраты, нетто, разбивка по способам оплаты. Только прошлое/сегодня, период не длиннее 31 дня.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Начало YYYY-MM-DD" },
          to: { type: "string", description: "Конец YYYY-MM-DD" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pms_guest_flow",
      description: "Сводка потока гостей за период: заезды, выезды, всего человек, броней.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Начало YYYY-MM-DD" },
          to: { type: "string", description: "Конец YYYY-MM-DD" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "public_prices",
      description:
        "Публичные цены и доступность для гостей (движок бронирования): варианты проживания с ценами за ВЕСЬ период и платные услуги (бассейн). ВАЖНО: цены зависят от даты (будни/выходные отличаются) — чтобы узнать цену за конкретную ночь, вызывай на ОДНУ ночь (checkout = checkin + 1 день); для нескольких ночей/дат делай отдельный вызов на каждую.",
      parameters: {
        type: "object",
        properties: {
          checkin: { type: "string", description: "Заезд YYYY-MM-DD" },
          checkout: { type: "string", description: "Выезд YYYY-MM-DD (по умолчанию +1 ночь)" },
          adults: { type: "integer", description: "Гостей, по умолчанию 2" },
        },
        required: ["checkin"],
      },
    },
  },
];

async function runTool(name: string, rawArgs: string): Promise<unknown> {
  let a: Record<string, unknown> = {};
  try {
    a = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    /* empty */
  }
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim() : "");
  const badDates = (...ds: string[]) => ds.some((d) => !ISO.test(d));

  switch (name) {
    case "pms_availability": {
      if (badDates(str("date"))) return { ok: false, error: "bad_date_format" };
      return getAvailability(str("date"));
    }
    case "pms_bookings": {
      if (badDates(str("from"), str("to"))) return { ok: false, error: "bad_date_format" };
      const res = await getBookingsInPeriod(str("from"), str("to"));
      if (!res.ok) return res;
      const items = res.data.flatMap((b) =>
        (b.roomStays ?? []).map((s) => ({
          booking: b.number,
          guest:
            [b.customer?.lastName, b.customer?.firstName].filter(Boolean).join(" ") || undefined,
          phone: b.customer?.phones?.[0],
          roomType: roomTypeName(s.roomTypeId),
          checkIn: s.checkInDateTime,
          checkOut: s.checkOutDateTime,
          status: s.status,
          bookingStatus: s.bookingStatus,
          guests: (s.guestCountInfo?.adults ?? 0) + (s.guestCountInfo?.children ?? 0),
          totalUZS: s.totalPrice?.amount,
          source: b.sourceChannelName,
        })),
      );
      return { ok: true, count: items.length, items: items.slice(0, 40) };
    }
    case "pms_finance": {
      if (badDates(str("from"), str("to"))) return { ok: false, error: "bad_date_format" };
      return getFinance(str("from"), str("to"));
    }
    case "pms_guest_flow": {
      if (badDates(str("from"), str("to"))) return { ok: false, error: "bad_date_format" };
      return getGuestFlow(str("from"), str("to"));
    }
    case "public_prices":
      return checkAvailability({
        checkin: str("checkin"),
        checkout: str("checkout") || undefined,
        adults: typeof a.adults === "number" ? (a.adults as number) : undefined,
      });
    default:
      return { ok: false, error: "unknown_tool" };
  }
}

// ── prompt ────────────────────────────────────────────────────────────────────

const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

/** The model must never do date math itself — give it a ready calendar. */
function calendarLines(days = 14): string {
  const base = new Date(Date.now() + 5 * 3600_000); // hotel time, UTC+5
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(base.getTime() + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const w = WEEKDAYS[d.getUTCDay()];
    const mark = i === 0 ? "  ← СЕГОДНЯ" : i === 1 ? "  ← завтра" : "";
    out.push(`${iso} — ${w}${mark}`);
  }
  return out.join("\n");
}

function systemPrompt(): string {
  return [
    "Ты — внутренний ИИ-ассистент персонала загородного комплекса CHIMGAN DARBAZA (Чимган, Узбекистан).",
    "Ты отвечаешь сотрудникам в служебном Telegram-боте. Собеседник — персонал, НЕ гость.",
    "",
    "КАЛЕНДАРЬ ближайших дней (даты и дни недели бери ТОЛЬКО отсюда, сам не вычисляй):",
    calendarLines(),
    "",
    "═══ ЗНАНИЯ О КОМПЛЕКСЕ (можешь отвечать по ним напрямую, без инструментов) ═══",
    venueFacts(),
    "═══════════════════════════════════════════════════════════════════",
    "",
    "ЖИВЫЕ ДАННЫЕ — только из инструментов (Exely PMS, отель 514200):",
    "- pms_availability — шахматка на дату; pms_bookings — кто живёт/заезжает (имена, телефоны);",
    "- pms_finance — деньги за период (не будущее, ≤31 дня); pms_guest_flow — сводка заездов/выездов;",
    "- public_prices — цены ПРОЖИВАНИЯ и бассейна на конкретные даты (они зависят от даты!).",
    "",
    "Что откуда: цены дневного отдыха (топчан, въезд, мангал, казан, дрова, уголь) — ФИКСИРОВАННЫЕ,",
    "бери из знаний выше, инструмент не нужен. Цены проживания (Глэмпинг/Шале) и бассейна — ТОЛЬКО",
    "через public_prices. Занятость, гости, деньги — только через pms_*. Топчаны и бассейн в шахматке",
    "PMS отсутствуют (дневной формат). Валюта — UZS, суммы пиши с разделителями (1 200 000 UZS).",
    "Персонал может спросить «что ответить гостю…» — подскажи готовый ответ по знаниям выше",
    "(правила отмены, время заезда, что взять с собой, питомцы и т.д.).",
    "",
    "ПРАВИЛА ТОЧНОСТИ (важнее всего):",
    "1. Дату и день недели сверяй по календарю выше. «Суббота» = ближайшая суббота из календаря.",
    "2. Цены зависят от даты (будни и выходные отличаются). НИКОГДА не называй цену без вызова",
    "   public_prices на эту КОНКРЕТНУЮ дату. Спросили про несколько дат — отдельный вызов на каждую ночь.",
    "3. Не обобщай («цены не меняются», «всегда столько») — говори только про даты, которые проверил.",
    "4. Рядом с ценой всегда указывай тип (Глэмпинг/Шале), дату и день недели: «сб 25.07 — Глэмпинг 1 600 000 UZS».",
    "5. Инструмент вернул ошибку или пусто — так и скажи, не выдумывай. Не уверен — проверь инструментом.",
    "6. Дата названа неточно («в будни», «на неделе») — не переспрашивай: сам возьми ближайший подходящий",
    "   день из календаря, проверь его и явно скажи, за какую дату цифра. Уточняй только при реальной двусмысленности.",
    "",
    "ТОН: тёплый и доброжелательный, как заботливый коллега 😊 Отвечай живо и по-человечески,",
    "1–2 уместных эмодзи, в конце коротко предложи помочь ещё («Нужно что-то ещё — только скажите!»).",
    "При этом кратко и по делу: цифры точные, без воды. Отвечай на языке вопроса (по умолчанию — по-русски).",
    "БЕЗ Markdown и HTML — только простой текст и переносы строк.",
    "На вопросы не про работу отеля мягко откажись и предложи /menu.",
  ].join("\n");
}

// ── Groq loop ─────────────────────────────────────────────────────────────────

async function callGroq(apiKey: string, messages: GroqMsg[], withTools: boolean) {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 700,
    // "medium": noticeably better date/tool planning than "low", still fast on Groq.
    reasoning_effort: "medium",
  };
  if (withTools) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }
  return fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
}

export type StaffAiResult = { ok: true; text: string } | { ok: false; error: string };

// Short per-chat memory so follow-ups («а на воскресенье?») keep their context.
// In-process only: survives while the lambda/process is warm, resets on cold
// start — an acceptable trade-off vs. adding a store.
const HISTORY_TTL_MS = 30 * 60_000;
const HISTORY_MAX_TURNS = 8; // user+assistant messages kept per chat
const history = new Map<number, { at: number; msgs: GroqMsg[] }>();

function chatHistory(chatId: number): GroqMsg[] {
  const h = history.get(chatId);
  if (!h || Date.now() - h.at > HISTORY_TTL_MS) return [];
  return h.msgs;
}
function remember(chatId: number, question: string, answer: string) {
  const msgs = [
    ...chatHistory(chatId),
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ].slice(-HISTORY_MAX_TURNS);
  history.set(chatId, { at: Date.now(), msgs });
  if (history.size > 200) {
    // Drop the oldest entries so the map can't grow unbounded.
    const oldest = [...history.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) history.delete(oldest[0]);
  }
}

/**
 * Answer one staff question. Context = short in-process history for this chat
 * plus (optionally) the bot message the staffer replied to.
 */
export async function answerStaffQuestion(
  question: string,
  opts: { chatId?: number; repliedTo?: string } = {},
): Promise<StaffAiResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "no_groq_key" };

  const messages: GroqMsg[] = [{ role: "system", content: systemPrompt() }];
  if (opts.chatId != null) messages.push(...chatHistory(opts.chatId));
  if (opts.repliedTo?.trim())
    messages.push({ role: "assistant", content: opts.repliedTo.slice(0, 1500) });
  messages.push({ role: "user", content: question.slice(0, 1000) });

  try {
    for (let round = 0; round < 3; round++) {
      const res = await callGroq(apiKey, messages, true);
      if (!res.ok) {
        console.error(`[staff-ai] Groq ${res.status}:`, (await res.text().catch(() => "")).slice(0, 200));
        return { ok: false, error: `groq_${res.status}` };
      }
      const msg = ((await res.json()) as GroqResponse).choices?.[0]?.message;
      if (!msg) return { ok: false, error: "groq_empty" };

      if (msg.tool_calls?.length) {
        messages.push(msg);
        const results = await Promise.all(
          msg.tool_calls.map((tc) => runTool(tc.function?.name ?? "", tc.function?.arguments ?? "")),
        );
        msg.tool_calls.forEach((tc, i) =>
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(results[i]) }),
        );
        continue;
      }

      const text = msg.content?.trim();
      if (text) return finish(question, text, opts.chatId);
      return { ok: false, error: "groq_empty" };
    }

    // Tool budget exhausted — force a final answer from what's gathered.
    const res = await callGroq(apiKey, messages, false);
    if (!res.ok) return { ok: false, error: `groq_${res.status}` };
    const text = ((await res.json()) as GroqResponse).choices?.[0]?.message?.content?.trim();
    return text ? finish(question, text, opts.chatId) : { ok: false, error: "groq_empty" };
  } catch (e) {
    console.error("[staff-ai] threw:", e);
    return { ok: false, error: "ai_failed" };
  }
}

function finish(question: string, text: string, chatId?: number): StaffAiResult {
  // The model is told "no Markdown", but small models slip — strip emphasis
  // markers so Telegram never shows literal ** / ` / ### characters.
  const plain = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1");
  const clipped = plain.slice(0, 3800);
  if (chatId != null) remember(chatId, question, clipped);
  // Observability: staff Q&A in server logs (dev console / Vercel logs).
  console.log(`[staff-ai] Q: ${question.slice(0, 120)} | A: ${clipped.slice(0, 300).replace(/\n/g, " ⏎ ")}`);
  return { ok: true, text: clipped };
}
