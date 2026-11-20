import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Группа «Chimgan Darbaza - Заявки» 11.11.2026 стала супергруппой — старый id
 * отвечал «group chat was upgraded to a supergroup chat», и заявки неделю не
 * доходили. Отправка должна сама уйти в новый чат из migrate_to_chat_id и
 * запомнить его в файле: после перезапуска сайта — сразу в новый чат, без
 * повторного «группа сменила ID» и без ложной тревоги сторожа (19.11.2026).
 */
const OLD = "-4950000000";
const NEW = -1003972473111;

describe("telegram — переезд группы в супергруппу", () => {
  const calls: Array<{ chat_id: unknown; text?: string }> = [];
  let dir = "";
  beforeEach(() => {
    calls.length = 0;
    dir = mkdtempSync(join(tmpdir(), "tg-migrate-"));
    vi.resetModules();
    vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_MIGRATIONS_FILE", join(dir, "telegram-chat-migrations.json"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        calls.push({ chat_id: body.chat_id, text: body.text });
        const ok = String(body.chat_id) === String(NEW);
        return new Response(
          JSON.stringify(
            ok
              ? { ok: true, result: { message_id: 1 } }
              : { ok: false, description: "Bad Request: group chat was upgraded to a supergroup chat", parameters: { migrate_to_chat_id: NEW } },
          ),
        );
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  });

  it("повторяет отправку в новый чат и дальше шлёт сразу туда — без служебных сообщений в группу", async () => {
    const { sendMessage } = await import("@/lib/telegram");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await sendMessage(OLD, "заявка 1")).toEqual({ message_id: 1 });
    // старый чат → повтор в новый; о переезде группе не пишем (владелец, 20.11.2026)
    expect(calls.map((c) => String(c.chat_id))).toEqual([OLD, String(NEW)]);
    expect(calls.some((c) => String(c.text).includes("сменила ID"))).toBe(false);
    // строка журнала, по которой сторож один раз пишет об этом письмом
    expect(errors.mock.calls.some((a) => /^\[telegram\] chat -?\d+ was upgraded to supergroup -?\d+ — sending there/.test(String(a[0])))).toBe(true);
    expect(errors.mock.calls.some((a) => String(a[0]).includes(`TELEGRAM_ADMIN_CHAT_ID=${NEW}`))).toBe(true);

    calls.length = 0;
    expect(await sendMessage(OLD, "заявка 2")).toEqual({ message_id: 1 });
    expect(calls.map((c) => String(c.chat_id))).toEqual([String(NEW)]); // без лишнего запроса в старый чат
    errors.mockRestore();
  });

  it("из файла берутся только настоящие ID супергрупп («-100…»)", async () => {
    writeFileSync(join(dir, "telegram-chat-migrations.json"), JSON.stringify({ [OLD]: "-123456" }));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendMessage } = await import("@/lib/telegram");
    await sendMessage(OLD, "заявка");
    expect(String(calls[0].chat_id)).toBe(OLD); // «-123456» не принят — шлём как настроено
    errors.mockRestore();
  });

  it("после перезапуска сайта — сразу в новый чат, без заметки и без записи в журнал", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await (await import("@/lib/telegram")).sendMessage(OLD, "до перезапуска");
    expect(JSON.parse(readFileSync(join(dir, "telegram-chat-migrations.json"), "utf8"))).toEqual({ [OLD]: NEW });

    vi.resetModules(); // «перезапуск» — память модуля пустая, файл остался
    calls.length = 0;
    errors.mockClear();
    const { sendMessage } = await import("@/lib/telegram");
    expect(await sendMessage(OLD, "после перезапуска")).toEqual({ message_id: 1 });
    expect(calls.map((c) => String(c.chat_id))).toEqual([String(NEW)]);
    expect(calls.some((c) => String(c.text).includes("сменила ID"))).toBe(false);
    expect(errors.mock.calls.some((a) => String(a[0]).includes("was upgraded"))).toBe(false);
    errors.mockRestore();
  });
});
