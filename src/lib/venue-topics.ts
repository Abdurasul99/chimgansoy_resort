import { venueFacts } from "@/lib/venue-facts";

/**
 * The venue briefing, split so the model can be given a little and ask for more.
 *
 * WHY THIS EXISTS
 * ---------------
 * The site concierge was returning 502 to every question. The cause was not a
 * bug in the code but arithmetic: the Groq free tier allows 8000 tokens per
 * MINUTE, and one turn was asking for 6436 — the whole venue briefing plus the
 * whole rulebook plus the tool schemas, on every message. One guest question
 * consumed the minute; the second got 429, the "fallback" model shared the same
 * ceiling, and the route gave up with ai_failed.
 *
 * Sending less is therefore not an optimisation, it is the fix. It is also the
 * upgrade: five thousand tokens of standing instructions dilute attention, and
 * the answers that came back before the outage showed it — rules about link
 * formatting competing with rules about pool tariffs for the same budget.
 *
 * So: a compact core goes in the system prompt, and everything a guest asks
 * about occasionally is fetched by the model through `lookup_facts` when it is
 * actually needed. A question about the weather no longer pays for the menu.
 *
 * The staff Telegram bot keeps the full briefing — it serves one person, not
 * the public, so its request rate is nowhere near the ceiling.
 */

export const TOPICS = ["pool", "menu", "directions", "policy", "extras", "rooms"] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABEL: Record<Topic, string> = {
  pool: "полный тариф бассейна по возрастам и дням",
  menu: "меню летнего ресторана и правила своей еды",
  directions: "как добраться, координаты, ссылки на карты",
  policy: "отмена, перенос, предоплата, депозит, животные",
  extras: "аренда мангала и казана, дрова, уголь, парковка",
  rooms: "подробный состав шале и глэмпинга, что включено",
};

/** Pulls one titled block out of the full briefing by its heading. */
function section(from: string, startsWith: string, stopAt: string[]): string {
  const lines = from.split("\n");
  const i = lines.findIndex((l) => l.startsWith(startsWith));
  if (i === -1) return "";
  const out: string[] = [lines[i]];
  for (let j = i + 1; j < lines.length; j++) {
    if (stopAt.some((s) => lines[j].startsWith(s))) break;
    out.push(lines[j]);
  }
  return out.join("\n").trim();
}

const HEADINGS = [
  "О КОМПЛЕКСЕ",
  "ОТДЫХ НА ДЕНЬ",
  "ДОП. УСЛУГИ",
  "ПРОЖИВАНИЕ С НОЧЁВКОЙ",
  "БРОНИРОВАНИЕ",
  "ОТМЕНА И ПЕРЕНОС",
  "ОТМЕНА — ДНЕВНЫЕ",
  "БАССЕЙН — ПОЛНЫЙ ТАРИФ",
  "КАК ДОБРАТЬСЯ",
  "ПОГОДА",
  "ЖИВОТНЫЕ",
  "КОНТАКТЫ",
];

/** The detail behind one topic, as plain text for the model to read. */
export function venueTopic(topic: Topic): string {
  const all = venueFacts();
  const grab = (h: string) => section(all, h, HEADINGS.filter((x) => x !== h));

  switch (topic) {
    case "pool":
      return grab("БАССЕЙН — ПОЛНЫЙ ТАРИФ");
    case "menu":
      return grab("ДОП. УСЛУГИ");
    case "directions":
      return [grab("КАК ДОБРАТЬСЯ"), grab("КОНТАКТЫ")].filter(Boolean).join("\n\n");
    case "policy":
      return [
        grab("БРОНИРОВАНИЕ"),
        grab("ОТМЕНА И ПЕРЕНОС"),
        grab("ОТМЕНА — ДНЕВНЫЕ"),
        grab("ЖИВОТНЫЕ"),
      ]
        .filter(Boolean)
        .join("\n\n");
    case "extras":
      return [grab("ДОП. УСЛУГИ"), grab("ОТДЫХ НА ДЕНЬ")].filter(Boolean).join("\n\n");
    case "rooms":
      return grab("ПРОЖИВАНИЕ С НОЧЁВКОЙ");
    default:
      return "";
  }
}
