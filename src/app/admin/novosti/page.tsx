import { AdminHeading } from "../AdminShell";
import { NewsForm } from "./NewsForm";
import { readForEdit } from "@/lib/site-overrides";

export default async function Page() {
  const overrides = await readForEdit();
  const storeReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  // Newest first, by the date the operator chose rather than by save order —
  // a post backdated to last week belongs under one dated today.
  const items = [...overrides.news].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);

  return (
    <>
      <AdminHeading
        title="Новости"
        hint="Публикуется на сайте: chimgandarbaza.uz/ru/novosti. Появляется сразу после сохранения."
      />
      <NewsForm items={items} storeReady={storeReady} today={today} />
      <p className="mt-8 text-xs leading-6 text-[var(--muted)]">
        Текст показывается на всех трёх языках одинаково — переводов здесь нет.
        «Скрыть» убирает новость с сайта, но оставляет её тут; «удалить» стирает
        насовсем.
      </p>
    </>
  );
}
