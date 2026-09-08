import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * Проверка фотографий главной — тем же скриптом, что и вручную.
 *
 * 05.09.2026 в ленте заменили два кадра, а уменьшенные копии для новых не
 * собрали: на главной висел битый прямоугольник с подписью «Два домика
 * A-frame крупным планом». Скрипт это поймал и вернул код 1 — но его вывод
 * отфильтровали грепом и не прочли.
 *
 * Отсюда тест: то же самое, но молча не проходит мимо.
 */
describe("фотографии главной", () => {
  it("каждый кадр используется один раз и у ленты есть уменьшенные копии", () => {
    let output = "";
    try {
      output = execFileSync(process.execPath, ["scripts/check-home-photos.js"], {
        encoding: "utf8",
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      throw new Error(`check-home-photos не прошёл:\n${e.stdout ?? ""}${e.stderr ?? ""}`);
    }
    expect(output).toContain("ok —");
  });
});
