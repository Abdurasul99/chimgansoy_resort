/**
 * Admin session guarantees.
 *
 * These are the properties that keep /admin shut, so they are tested against
 * the real crypto rather than a mock: a forged cookie must be refused, an
 * expired one must be refused, and a missing AUTH_SECRET must fail closed
 * rather than throw into a render (which in a server component would surface
 * as a 500 page, not as a login form).
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "node:crypto";

const SECRET = "test-secret-not-the-real-one";
const PASSWORD = "correct-horse";

/** The cookie jar next/headers hands back, minimal but faithful. */
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (jar.has(k) ? { name: k, value: jar.get(k)! } : undefined),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
  }),
}));

const COOKIE = "cd_admin";
const signWith = (secret: string, exp: number) =>
  `${exp}.${createHmac("sha256", secret).update(String(exp)).digest("hex")}`;

async function load() {
  vi.resetModules();
  return import("../admin-auth");
}

describe("admin auth", () => {
  beforeEach(() => {
    jar.clear();
    vi.stubEnv("AUTH_SECRET", SECRET);
    vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the right password and refuses everything else", async () => {
    const { passwordMatches } = await load();
    expect(passwordMatches(PASSWORD)).toBe(true);
    expect(passwordMatches("wrong")).toBe(false);
    expect(passwordMatches("")).toBe(false);
    // A prefix must not pass: length is compared before the bytes are.
    expect(passwordMatches(PASSWORD.slice(0, -1))).toBe(false);
    expect(passwordMatches(PASSWORD + "x")).toBe(false);
  });

  it("a session started is a session recognised", async () => {
    const { startSession, isSignedIn } = await load();
    expect(await isSignedIn()).toBe(false);
    await startSession();
    expect(await isSignedIn()).toBe(true);
  });

  it("signing out ends it", async () => {
    const { startSession, endSession, isSignedIn } = await load();
    await startSession();
    await endSession();
    expect(await isSignedIn()).toBe(false);
  });

  it("refuses a cookie signed with a different secret", async () => {
    const { isSignedIn } = await load();
    jar.set(COOKIE, signWith("some-other-secret", Date.now() + 60_000));
    expect(await isSignedIn()).toBe(false);
  });

  it("refuses an expired cookie even though its signature is valid", async () => {
    const { isSignedIn } = await load();
    jar.set(COOKIE, signWith(SECRET, Date.now() - 1_000));
    expect(await isSignedIn()).toBe(false);
  });

  it("refuses malformed cookies without throwing", async () => {
    const { isSignedIn } = await load();
    for (const bad of ["", "garbage", "123", ".", "abc.def", `${Date.now() + 60_000}.zz`]) {
      jar.set(COOKIE, bad);
      expect(await isSignedIn()).toBe(false);
    }
  });

  it("fails closed when AUTH_SECRET is missing, instead of throwing", async () => {
    // A valid cookie from a correctly configured deployment, presented to one
    // where the secret has been removed. isSignedIn() must answer false —
    // throwing here would render a 500 instead of the login form.
    const good = signWith(SECRET, Date.now() + 60_000);
    vi.stubEnv("AUTH_SECRET", "");
    const { isSignedIn, authConfigured } = await load();
    jar.set(COOKIE, good);
    expect(await isSignedIn()).toBe(false);
    expect(authConfigured()).toBe(false);
  });

  it("requireAdmin throws for a stranger and is silent for a session", async () => {
    const { requireAdmin, startSession } = await load();
    await expect(requireAdmin()).rejects.toThrow(/not authorised/i);
    await startSession();
    await expect(requireAdmin()).resolves.toBeUndefined();
  });

  it("authConfigured needs both variables", async () => {
    {
      vi.stubEnv("ADMIN_PASSWORD", "");
      const { authConfigured } = await load();
      expect(authConfigured()).toBe(false);
    }
    {
      vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
      vi.stubEnv("AUTH_SECRET", "");
      const { authConfigured } = await load();
      expect(authConfigured()).toBe(false);
    }
  });
});

describe("роли панели (ресторан)", () => {
  beforeEach(() => {
    jar.clear();
    vi.stubEnv("AUTH_SECRET", SECRET);
    vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
    vi.stubEnv("RESTAURANT_MANAGER_PASSWORD", "manager-pass-1");
    vi.stubEnv("RESTAURANT_STAFF_PASSWORD", "staff-pass-22");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("пароль определяет роль", async () => {
    const { passwordRole } = await load();
    expect(passwordRole(PASSWORD)).toBe("owner");
    expect(passwordRole("manager-pass-1")).toBe("manager");
    expect(passwordRole("staff-pass-22")).toBe("staff");
    expect(passwordRole("nope")).toBeNull();
  });

  it("не заданный пароль роли не открывает её пустой строкой", async () => {
    vi.stubEnv("RESTAURANT_STAFF_PASSWORD", "");
    const { passwordRole } = await load();
    expect(passwordRole("")).toBeNull();
  });

  it("сессия помнит роль и имя; старая cookie без роли — владелец", async () => {
    const { startSession, getSession } = await load();
    await startSession("manager", "Азиз");
    expect(await getSession()).toEqual({ role: "manager", name: "Азиз" });
    jar.set(COOKIE, signWith(SECRET, Date.now() + 60_000));
    expect(await getSession()).toEqual({ role: "owner", name: "" });
  });

  it("вход ресторана не проходит requireAdmin, но проходит свою роль", async () => {
    const { startSession, requireAdmin, requireRole } = await load();
    await startSession("staff", "Официант");
    await expect(requireAdmin()).rejects.toThrow(/not authorised/i);
    await expect(requireRole("owner", "manager")).rejects.toThrow(/not authorised/i);
    await expect(requireRole("owner", "manager", "staff")).resolves.toEqual({ role: "staff", name: "Официант" });
  });

  it("подменить роль в cookie нельзя — подпись не сойдётся", async () => {
    const { startSession, getSession } = await load();
    await startSession("staff");
    jar.set(COOKIE, jar.get(COOKIE)!.replace(".staff.", ".owner."));
    expect(await getSession()).toBeNull();
  });

  it("смена пароля роли выкидывает её входы, но не владельца", async () => {
    const { startSession, getSession } = await load();
    await startSession("staff", "Официант");
    const staffCookie = jar.get(COOKIE)!;
    await startSession("owner");
    const ownerCookie = jar.get(COOKIE)!;
    vi.stubEnv("RESTAURANT_STAFF_PASSWORD", "new-staff-pass");
    const again = await load();
    jar.set(COOKIE, staffCookie);
    expect(await again.getSession()).toBeNull();
    jar.set(COOKIE, ownerCookie);
    expect(await again.getSession()).toEqual({ role: "owner", name: "" });
    void getSession;
  });

  it("какие разделы открывает какая роль", async () => {
    const { roleCanOpen } = await load();
    expect(roleCanOpen("owner", "/admin/broni")).toBe(true);
    expect(roleCanOpen("manager", "/admin/restoran/menu")).toBe(true);
    expect(roleCanOpen("manager", "/admin/restoranX")).toBe(false);
    expect(roleCanOpen("manager", "/admin")).toBe(false);
    expect(roleCanOpen("staff", "/admin/restoran")).toBe(true);
    expect(roleCanOpen("staff", "/admin/restoran/stoly")).toBe(true);
    expect(roleCanOpen("staff", "/admin/restoran/nastroyki")).toBe(false);
  });
});
