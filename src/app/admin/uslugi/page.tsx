import { AdminHeading } from "../AdminShell";
import { ServicesForm } from "./ServicesForm";
import { resolveServices, type LiveService } from "@/lib/services-live";
import { readForEdit } from "@/lib/site-overrides";

/**
 * Reads uncached, like the price screen: an operator must never edit a copy
 * that is minutes old, or their own previous save is silently overwritten by
 * the form they are looking at.
 */
export default async function Page() {
  const overrides = await readForEdit();
  const items: LiveService[] = resolveServices(overrides);
  const storeReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  return (
    <>
      <AdminHeading
        title="Услуги"
        hint="Что показывать на сайте, какую цену писать на карточке, и свои услуги в дополнение к тем, что уже есть."
      />
      <ServicesForm items={items} storeReady={storeReady} />
      <p className="mt-8 text-xs leading-6 text-[var(--muted)]">
        Услуги из кода не удаляются — их можно только скрыть. Так фотографии и текст
        остаются на месте, и вернуть услугу весной это одна галочка, а не переписывание
        страницы. Удалять можно только то, что вы добавили сами.
      </p>
    </>
  );
}
