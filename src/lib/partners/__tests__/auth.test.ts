import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOCK_MS,
  MAX_FAILS,
  lockedFor,
  noteFailure,
  noteSuccess,
  partnersAuthConfigured,
  passwordWho,
  resetAttempts,
  sessionToken,
  sessionValid,
} from "../auth";

describe("вход в админку партнёров", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret-xxxxxxxxxxxxxxxx");
    vi.stubEnv("PARTNERS_ADMIN_PASSWORD", "partners-pass-123");
    vi.stubEnv("ADMIN_PASSWORD", "owner-pass-456");
    resetAttempts();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("пускает пароль партнёров и пароль владельца, больше никого", () => {
    expect(passwordWho("partners-pass-123")).toBe("partners");
    expect(passwordWho("owner-pass-456")).toBe("owner");
    expect(passwordWho("partners-pass-12")).toBeNull();
    expect(passwordWho("")).toBeNull();
  });

  it("без AUTH_SECRET или паролей — вход не настроен и сессий нет", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(partnersAuthConfigured()).toBe(false);
    expect(sessionValid("p1.1.partners.x.y")).toBe(false);
  });

  it("сессия: своя подпись проходит, подделка и истёкшая — нет", () => {
    const now = Date.now();
    const t = sessionToken("partners", now);
    expect(sessionValid(t, now)).toBe(true);
    expect(sessionValid(t.replace(".partners.", ".owner."), now)).toBe(false);
    expect(sessionValid(t.slice(0, -2) + "00", now)).toBe(false);
    expect(sessionValid(t, now + 13 * 3600_000)).toBe(false);
    expect(sessionValid(undefined)).toBe(false);
    expect(sessionValid("garbage")).toBe(false);
  });

  it("смена пароля сразу закрывает старые входы", () => {
    const t = sessionToken("partners");
    vi.stubEnv("PARTNERS_ADMIN_PASSWORD", "new-pass");
    expect(sessionValid(t)).toBe(false);
  });

  it("пароль убрали совсем — его сессии недействительны", () => {
    const t = sessionToken("partners");
    vi.stubEnv("PARTNERS_ADMIN_PASSWORD", "");
    expect(sessionValid(t)).toBe(false);
  });

  it("5 неудач подряд — блокировка адреса на 15 минут, успех сбрасывает счёт", () => {
    const now = 1_000_000;
    for (let i = 0; i < MAX_FAILS - 1; i++) noteFailure("1.2.3.4", now);
    expect(lockedFor("1.2.3.4", now)).toBe(0);
    noteFailure("1.2.3.4", now);
    expect(lockedFor("1.2.3.4", now)).toBe(LOCK_MS);
    expect(lockedFor("5.6.7.8", now)).toBe(0);
    expect(lockedFor("1.2.3.4", now + LOCK_MS)).toBe(0);

    noteFailure("9.9.9.9", now);
    noteSuccess("9.9.9.9");
    for (let i = 0; i < MAX_FAILS - 1; i++) noteFailure("9.9.9.9", now);
    expect(lockedFor("9.9.9.9", now)).toBe(0);
  });
});
