import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading } from "../../AdminShell";
import { FormBuilder } from "./FormBuilder";
import { readForEdit } from "@/lib/site-overrides";

/**
 * Форма заявки для услуги, созданной оператором.
 *
 * Только для своих услуг: у бассейна, тюбинга и топчана формы написаны в коде —
 * они считают цену, знают про выходные и тарифы, и подменять их набором полей
 * значило бы потерять этот расчёт.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await readForEdit();
  const service = data.customServices.find((c) => c.slug === slug);
  if (!service) notFound();

  const storeReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  return (
    <>
      <AdminHeading
        title={`Форма заявки: ${service.title}`}
        hint="Что спросить у гостя, когда он оставляет заявку на эту услугу. Порядок полей на сайте — такой же, как здесь."
      />
      <p className="mb-6 text-sm">
        <Link href="/admin/uslugi" className="font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]">
          ← ко всем услугам
        </Link>
      </p>

      <FormBuilder slug={slug} title={service.title} fields={service.formFields ?? []} storeReady={storeReady} />

      <p className="mt-8 text-xs leading-6 text-[var(--muted)]">
        Убранное поле перестаёт показываться гостям, но ответы в уже полученных заявках
        остаются на месте — они хранятся вместе с заявкой, а не ссылкой на форму.
      </p>
    </>
  );
}
