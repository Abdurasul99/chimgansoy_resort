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
      <AdminHeading title="Новости" hint="Публикация новостей и сезонных объявлений." />
      <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6">
        <p className="text-sm leading-7 text-[var(--muted)]">Раздел в работе — подключается следующим, вместе с публичной страницей новостей на сайте.<br /><br />Сейчас на сайте страницы новостей нет вообще, поэтому раздел появится сразу с обеих сторон: и здесь, и для гостей.</p>
      </div>
    </>
  );
}
