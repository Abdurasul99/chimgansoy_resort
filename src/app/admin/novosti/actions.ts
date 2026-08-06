"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { readForEdit, saveOverrides, type NewsItem } from "@/lib/site-overrides";

export type NewsFormState = { ok?: boolean; error?: string };

/** Today in Tashkent — the operator's calendar, not the server's. */
function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

/**
 * A stable id that does not need a random source.
 *
 * Crypto is available here, but an id built from the date and the title is
 * readable in the stored JSON, which matters the day somebody has to look at
 * the document by hand. The counter suffix keeps two posts on one day apart.
 */
function newsId(existing: NewsItem[], date: string): string {
  const sameDay = existing.filter((n) => n.id.startsWith(date)).length;
  return sameDay ? `${date}-${sameDay + 1}` : date;
}

export async function addNews(_prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  const dateRaw = String(formData.get("date") ?? "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : todayTashkent();

  if (title.length < 3) return { error: "Заголовок слишком короткий." };
  if (body.length < 10) return { error: "Напишите хотя бы пару предложений." };

  const data = await readForEdit();
  const item: NewsItem = {
    id: newsId(data.news, date),
    date,
    title,
    body,
    // Published straight away: a draft nobody can see is a feature nobody asked
    // for, and the switch below turns a post off in one click if it was early.
    published: true,
  };

  const res = await saveOverrides({ ...data, news: [item, ...data.news] });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Publish / unpublish, without deleting. */
export async function toggleNews(_prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const data = await readForEdit();
  const res = await saveOverrides({
    ...data,
    news: data.news.map((n) => (n.id === id ? { ...n, published: !n.published } : n)),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteNews(_prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const data = await readForEdit();
  const res = await saveOverrides({ ...data, news: data.news.filter((n) => n.id !== id) });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}
