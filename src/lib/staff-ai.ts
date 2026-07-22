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
        "Публичные цены и доступность для гостей на даты (движок бронирования): варианты проживания с ценами и платные услуги (бассейн). Для вопросов «сколько стоит».",
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

function systemPrompt(): string {
  const now = new Date(Date.now() + 5 * 3600_000); // hotel time, UTC+5
  const today = now.toISOString().slice(0, 10);
  const weekday = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"][
    now.getUTCDay()
  ];
  return [
    "Ты — внутренний ИИ-ассистент персонала загородного комплекса CHIMGAN DARBAZA (Чимган, Узбекистан).",
    "Ты отвечаешь сотрудникам в служебном Telegram-боте. Собеседник — персонал, НЕ гость.",
    "",
    `Сегодня ${today} (${weekday}), время отеля UTC+5.`,
    "",
    "Все цифры бери ТОЛЬКО из инструментов — это живые данные Exely PMS (отель 514200):",
    "- pms_availability — шахматка на дату; pms_bookings — кто живёт/заезжает (имена, телефоны);",
    "- pms_finance — деньги за период (не будущее, ≤31 дня); pms_guest_flow — сводка заездов/выездов;",
    "- public_prices — публичные цены проживания и услуг (бассейн) на даты.",
    "",
    "Контекст: в PMS 10 «Глэмпинг A-frame» + 10 «Шале» (ночёвки). Топчаны и бассейн — дневной формат,",
    "их нет в шахматке; цены на них — через public_prices. Валюта — UZS, суммы пиши с разделителями (1 200 000 UZS).",
    "",
    "Правила: отвечай кратко, на языке вопроса (по умолчанию по-русски). Указывай дату/период цифр (ДД.ММ).",
    "Относительные даты (сегодня, завтра, выходные) переводи в конкретные сам. БЕЗ Markdown и HTML —",
    "только простой текст, переносы строк и эмодзи. Если инструмент вернул ошибку — скажи об этом честно,",
    "не выдумывай цифры. На вопросы не про работу отеля коротко откажись и предложи /menu.",
  ].join("\n");
}

// ── Groq loop ─────────────────────────────────────────────────────────────────

async function callGroq(apiKey: string, messages: GroqMsg[], withTools: boolean) {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 700,
    reasoning_effort: "low",
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

/**
 * Answer one staff question. `repliedTo` is the bot message the staffer replied
 * to (if any) — the only conversation context we keep, everything else is
 * single-turn so the bot stays stateless on serverless.
 */
export async function answerStaffQuestion(
  question: string,
  repliedTo?: string,
): Promise<StaffAiResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "no_groq_key" };

  const messages: GroqMsg[] = [{ role: "system", content: systemPrompt() }];
  if (repliedTo?.trim()) messages.push({ role: "assistant", content: repliedTo.slice(0, 1500) });
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
      if (text) return { ok: true, text: text.slice(0, 3800) };
      return { ok: false, error: "groq_empty" };
    }

    // Tool budget exhausted — force a final answer from what's gathered.
    const res = await callGroq(apiKey, messages, false);
    if (!res.ok) return { ok: false, error: `groq_${res.status}` };
    const text = ((await res.json()) as GroqResponse).choices?.[0]?.message?.content?.trim();
    return text ? { ok: true, text: text.slice(0, 3800) } : { ok: false, error: "groq_empty" };
  } catch (e) {
    console.error("[staff-ai] threw:", e);
    return { ok: false, error: "ai_failed" };
  }
}
