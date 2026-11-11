"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { del, put } from "@/lib/blob-store";
import {
  PARTNERS_COOKIE,
  SESSION_TTL_S,
  lockedFor,
  noteFailure,
  noteSuccess,
  partnersAuthConfigured,
  passwordWho,
  sessionToken,
  sessionValid,
} from "@/lib/partners/auth";
import { MAX_PACKAGES, makeOfferKey, normalizeOfferInput } from "@/lib/partners/model";
import * as store from "@/lib/partners/store";

export type AdminState = { ok?: string; error?: string };

const BASE = "/ru/adminpartners";
const ATTEMPT_DELAY_MS = 1000;

async function clientIp(): Promise<string> {
  // nginx ставит X-Real-IP = $remote_addr сам и перезаписывает присланный.
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Каждое действие админки — только с действующей сессией. */
async function requireSession(): Promise<void> {
  if (!sessionValid((await cookies()).get(PARTNERS_COOKIE)?.value)) {
    throw new Error("Сессия истекла — войдите заново.");
  }
}

const fail = (e: unknown): AdminState => ({ error: e instanceof Error ? e.message : "Не удалось сохранить." });

function changed(key?: string) {
  revalidatePath(BASE);
  if (key) revalidatePath(`/ru/partners/o/${key}`);
}

// ─── Вход ──────────────────────────────────────────────────────────────────

export async function signInPartners(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!partnersAuthConfigured()) return { error: "Вход не настроен: нет PARTNERS_ADMIN_PASSWORD или AUTH_SECRET." };
  const ip = await clientIp();
  const wait = lockedFor(ip);
  if (wait > 0) return { error: `Слишком много попыток. Попробуйте через ${Math.ceil(wait / 60_000)} мин.` };

  await new Promise((r) => setTimeout(r, ATTEMPT_DELAY_MS));
  const who = passwordWho(String(form.get("password") ?? ""));
  if (!who) {
    noteFailure(ip);
    console.warn(`[adminpartners] неверный пароль с ${ip}`);
    return { error: "Неверный пароль." };
  }
  noteSuccess(ip);
  (await cookies()).set(PARTNERS_COOKIE, sessionToken(who), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
  redirect(BASE);
}

export async function signOutPartners(): Promise<void> {
  (await cookies()).delete(PARTNERS_COOKIE);
  redirect(BASE);
}

// ─── Предложения ───────────────────────────────────────────────────────────

function readForm(form: FormData) {
  return {
    company: form.get("company"),
    contact: form.get("contact"),
    lead: form.get("lead"),
    programs: form.getAll("programs"),
    packages: Array.from({ length: MAX_PACKAGES }, (_, i) => ({
      title: form.get(`pkg${i}_title`),
      price: form.get(`pkg${i}_price`),
      items: form.get(`pkg${i}_items`),
      note: form.get(`pkg${i}_note`),
    })),
    validUntil: form.get("validUntil"),
    status: form.get("status"),
    note: form.get("note"),
  };
}

export async function saveOffer(_prev: AdminState, form: FormData): Promise<AdminState> {
  let createdId: number | null = null;
  try {
    await requireSession();
    const parsed = normalizeOfferInput(readForm(form));
    if (!parsed.ok) return { error: parsed.error };
    const id = Number(form.get("id"));
    if (id > 0) {
      const offer = await store.getOffer(id);
      if (!offer) return { error: "Предложение не найдено — его могли удалить." };
      await store.updateOffer(id, parsed.value);
      changed(offer.key);
      return { ok: "Сохранено." };
    }
    // Новое: ключ с повтором на случай (почти невозможного) совпадения.
    for (let attempt = 0; attempt < 3 && !createdId; attempt++) {
      try {
        createdId = await store.createOffer(makeOfferKey(parsed.value.company), parsed.value);
      } catch (e) {
        if ((e as { code?: string }).code !== "23505") throw e;
      }
    }
    if (!createdId) return { error: "Не удалось создать ссылку — попробуйте ещё раз." };
    changed();
  } catch (e) {
    return fail(e);
  }
  redirect(`${BASE}/${createdId}?created=1`);
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export async function uploadOfferLogo(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    await requireSession();
    const id = Number(form.get("id"));
    const file = form.get("logo");
    if (!id || !(file instanceof File) || file.size === 0) return { error: "Выберите файл логотипа." };
    if (file.size > MAX_LOGO_BYTES) return { error: "Файл больше 5 МБ." };
    // SVG не принимаем: внутри него может быть скрипт.
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) return { error: "Нужен PNG, JPEG или WebP." };
    const out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" })
      .resize({ width: 600, height: 300, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100 })
      .toBuffer();
    const blob = await put(`partners/logos/${id}.webp`, out, { access: "public", contentType: "image/webp", addRandomSuffix: true });
    const old = await store.setOfferLogo(id, blob.url);
    if (old) await del(old).catch(() => {});
    const offer = await store.getOffer(id);
    changed(offer?.key);
    return { ok: "Логотип загружен." };
  } catch (e) {
    return fail(e);
  }
}

export async function removeOfferLogo(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    await requireSession();
    const id = Number(form.get("id"));
    const old = await store.setOfferLogo(id, "");
    if (old) await del(old).catch(() => {});
    const offer = await store.getOffer(id);
    changed(offer?.key);
    return { ok: "Логотип убран." };
  } catch (e) {
    return fail(e);
  }
}

/** Отозвать / вернуть ссылку, новый ключ, удалить — одной формой с кнопками. */
export async function offerAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    await requireSession();
    const id = Number(form.get("id"));
    const offer = await store.getOffer(id);
    if (!offer) return { error: "Предложение не найдено." };
    switch (form.get("op")) {
      case "revoke":
        await store.setOfferRevoked(id, true);
        changed(offer.key);
        return { ok: "Ссылка отозвана — по ней больше не открыть." };
      case "restore":
        await store.setOfferRevoked(id, false);
        changed(offer.key);
        return { ok: "Ссылка снова работает." };
      case "rekey": {
        await store.rekeyOffer(id, makeOfferKey(offer.company));
        changed(offer.key);
        return { ok: "Выдан новый адрес. Старая ссылка больше не открывается." };
      }
      case "delete": {
        const logo = await store.deleteOffer(id);
        if (logo) await del(logo).catch(() => {});
        changed(offer.key);
        break;
      }
      default:
        return { error: "Неизвестное действие." };
    }
  } catch (e) {
    return fail(e);
  }
  redirect(BASE);
}
