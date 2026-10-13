import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ни одна страница не объявляет `dynamicParams = false`.
 *
 * Панель после каждого сохранения (услуги, домики, новости, цены) делает
 * revalidatePath("/", "layout"). В Next 16 у страницы с dynamicParams = false
 * после такого сброса пропадает запись в кэше, и она отвечает 404
 * («Internal: NoFallbackError») до перезапуска сайта. Так страницы глэмпинга,
 * шале и бассейна лежали 30.09.2026 и 12.10.2026. Несуществующий адрес
 * отвечает 404 через notFound() в самой странице.
 */

const APP = join(__dirname, "..", "..", "app");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : files(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe("страницы переживают сброс кэша из панели", () => {
  it("нет dynamicParams = false", () => {
    const offenders = files(APP)
      .filter((f) => /export\s+const\s+dynamicParams\s*=\s*false/.test(readFileSync(f, "utf8")))
      .map((f) => relative(APP, f));
    expect(offenders).toEqual([]);
  });
});
