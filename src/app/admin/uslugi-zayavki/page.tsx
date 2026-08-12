import { AdminHeading } from "../AdminShell";
import { ServiceList } from "./ServiceList";
import { listServiceRequests, type ServiceRequestRow } from "@/lib/pms";

/**
 * Заявки на услуги — отдельно от броней на проживание.
 *
 * У них нет ни номера, ни даты выезда, зато есть ответы на поля, которые
 * оператор задал сам. Общий список с бронями означал бы, что половина колонок
 * всегда пустая, а фильтр «услуги/проживание» приходится держать в голове.
 */
export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage() {
  let items: ServiceRequestRow[] = [];
  let error: string | null = null;
  try {
    items = await listServiceRequests();
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  const live = items.filter((r) => r.status === "new" || r.status === "confirmed");

  return (
    <>
      <AdminHeading
        title="Заявки на услуги"
        hint="Бассейн, топчан, тюбинг и всё, что вы добавили сами. Подтверждение гостю — звонком: почту здесь не спрашиваем."
      />
      {error ? (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
          Не удалось прочитать базу: {error}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {items.length} заявок · {live.length} в работе
          </p>
          <ServiceList items={items} />
        </>
      )}
    </>
  );
}
