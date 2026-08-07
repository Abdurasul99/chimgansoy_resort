import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePricing } from "@/lib/pricing-resolve";
import { faqItems } from "@/content/faq";
import { venueCore, venueFacts, money } from "@/lib/venue-facts";
import { buildSystemPrompt } from "@/lib/ai-context";

/**
 * A price written into the source as prose is a price the operator cannot
 * change from anywhere — not from the admin, and not even by editing
 * pricing.ts, because it is a sentence rather than a number.
 *
 * The site had 38 of them. The gold pool button on the first screen was one:
 * "Kun bo'yi tarif · 100 000 so'mdan". These tests keep the count from growing
 * back, and check the surfaces that matter actually follow the tariff.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir = SRC): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      out.push(...sourceFiles(full));
      continue;
    }
    if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

/**
 * Files allowed to contain a literal price, with the reason.
 *
 * Not a blanket exemption: each entry is a place where the number is not a
 * price a guest is quoted.
 */
const ALLOWED: Record<string, string> = {
  "app/admin/uslugi/ServicesForm.tsx": "placeholder-примеры в полях ввода",
  "components/sections/ServicesGrid.tsx": "пример в комментарии",
  "content/assistant-knowledge.ts": "мёртвый файл, его никто не импортирует",
  "lib/ai-context.ts": "примеры форматирования чисел в правилах ответа",
  "lib/staff-ai.ts": "примеры форматирования чисел в правилах бота",
};

describe("цены не зашиты в текст", () => {
  it("новых захардкоженных цен не появилось", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
      if (ALLOWED[rel]) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // комментарии объясняют, а не отображаются
          if (/\d{2,3}[\s ]\d{3}(?:[\s ]\d{3})?\s*(?:сум|so'm|so‘m|UZS)/i.test(line)) {
            offenders.push(`${rel}:${i + 1}`);
          }
        });
    }

    expect(
      offenders,
      `цена вписана текстом и не изменится из админки:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });
});

describe("правка цены доходит до каждой витрины", () => {
  const patched = resolvePricing({
    "pool.adult.weekday": 424_242,
    "topchan.rent.weekday": 313_131,
    "parking.weekday": 121_212,
    "deposit.perCabin": 989_898,
  });

  it("FAQ на главной — и он же уходит в Google как FAQPage", () => {
    const text = JSON.stringify(faqItems(patched));
    expect(text).toContain(money(424_242));
    expect(text).toContain(money(313_131));
  });

  it("краткий брифинг ИИ", () => {
    const text = venueCore(patched);
    expect(text).toContain(money(424_242));
    expect(text).toContain(money(989_898));
  });

  it("полный брифинг ИИ", () => {
    const text = venueFacts(patched);
    expect(text).toContain(money(424_242));
    expect(text).toContain(money(121_212));
    expect(text).toContain(money(989_898));
  });

  it("правила ответа консьержа", () => {
    // Парковка названа не только в знаниях, но и в правилах — если правило
    // отстанет, модель поверит правилу.
    expect(buildSystemPrompt("ru", patched)).toContain(money(121_212));
  });

  it("без правок всё как в коде", () => {
    expect(JSON.stringify(faqItems(resolvePricing()))).toBe(JSON.stringify(faqItems()));
    expect(venueCore(resolvePricing())).toBe(venueCore());
  });
});
