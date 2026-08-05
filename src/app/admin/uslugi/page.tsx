import { AdminHeading } from "../AdminShell";

/**
 * Placeholder with a real explanation.
 *
 * A nav item leading to a blank screen is what the operator complained about
 * once already; a nav item that says what it will do and what it is waiting for
 * is at least honest.
 */
export default function Page() {
  return (
    <>
      <AdminHeading title="Услуги" hint="Добавление, скрытие и редактирование услуг на территории." />
      <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6">
        <p className="text-sm leading-7 text-[var(--muted)]">Раздел в работе — подключается следующим. Хранилище уже готово: правки лягут поверх того, что в коде, и сайт продолжит работать, даже если хранилище окажется недоступно.<br /><br />Фотографии будут выбираться из уже загруженных на сайт, а не грузиться с телефона: на сайте нет оптимизации изображений, и снимок на 6 МБ уехал бы каждому посетителю как есть.</p>
      </div>
    </>
  );
}
