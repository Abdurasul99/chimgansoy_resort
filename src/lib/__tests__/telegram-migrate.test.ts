import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Группа «Chimgan Darbaza - Заявки» 11.11.2026 стала супергруппой — старый id
 * отвечал «group chat was upgraded to a supergroup chat», и заявки неделю не
 * доходили. Отправка должна сама уйти в новый чат из migrate_to_chat_id.
 */
const OLD = "-4950000000";
const NEW = -1003972473111;

describe("telegram — переезд группы в супергруппу", () => {
  const calls: Array<{ chat_id: unknown }> = [];
  beforeEach(() => {
    calls.length = 0;
    vi.resetModules();
    vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        calls.push({ chat_id: body.chat_id });
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
  });

  it("повторяет отправку в новый чат и дальше шлёт сразу туда", async () => {
    const { sendMessage } = await import("@/lib/telegram");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await sendMessage(OLD, "заявка 1")).toEqual({ message_id: 1 });
    // старый чат → повтор в новый → одна заметка самой группе, что она сменила ID
    expect(calls.map((c) => String(c.chat_id))).toEqual([OLD, String(NEW), String(NEW)]);
    expect(errors.mock.calls.some((a) => String(a[0]).includes(`TELEGRAM_ADMIN_CHAT_ID=${NEW}`))).toBe(true);

    calls.length = 0;
    expect(await sendMessage(OLD, "заявка 2")).toEqual({ message_id: 1 });
    expect(calls.map((c) => String(c.chat_id))).toEqual([String(NEW)]); // без лишнего запроса в старый чат
    errors.mockRestore();
  });
});
