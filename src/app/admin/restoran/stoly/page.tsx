import Link from "next/link";
import { after } from "next/server";
import { AdminHeading } from "../../AdminShell";
import { getSession } from "@/lib/admin-auth";
import type { RestaurantSettings, StatusLogEntry, TableRequest } from "@/lib/restaurant/model";
import { restaurantChats, retryPendingNotifications, telegramReady } from "@/lib/restaurant/notify";
import { tashkentNow } from "@/lib/restaurant/rules";
import {
  countNewOrders,
  dbConfigured,
  getTable,
  historyFor,
  listTables,
  readSettings,
  type TableFilter,
} from "@/lib/restaurant/store";
import { AutoRefresh, ScrollToCard } from "../AutoRefresh";
import { StateNotice, TelegramNotice } from "../Notices";
import { RestoranTabs } from "../RestoranTabs";
import { TablesList } from "../TablesList";
import { DbOffline, FilterLink, StoreError, plural } from "../ui";

/**
 * Брони столов. По умолчанию — предстоящие и ещё живые, по дате визита:
 * персоналу важно, кто придёт сегодня вечером, а не кто писал последним.
 */
export const dynamic = "force-dynamic";

const FILTERS: { id: TableFilter; label: string }[] = [
  { id: "upcoming", label: "Предстоящие" },
  { id: "new", label: "Новые" },
  { id: "today", label: "Сегодня" },
  { id: "past", label: "Прошедшие и закрытые" },
  { id: "all", label: "Все" },
];

const LIMIT = 200;

type Props = { searchParams: Promise<{ f?: string; tests?: string; t?: string }> };

function href(filter: TableFilter, tests: boolean): string {
  return `/admin/restoran/stoly?f=${filter}${tests ? "&tests=1" : ""}`;
}

export default async function RestaurantTablesPage({ searchParams }: Props) {
  const { f, tests, t } = await searchParams;
  const session = await getSession();
  const role = session?.role ?? "staff";
  const filter = FILTERS.find((x) => x.id === f) ?? FILTERS[0];
  const withTests = tests === "1";
  const focusId = /^\d{1,12}$/.test(t ?? "") ? Number(t) : null;

  const heading = (
    <AdminHeading
      title="Ресторан — столы"
      hint="Брони столов с сайта. Бронь не действует, пока её не подтвердили: позвоните гостю, затем нажмите «Подтвердить»."
    />
  );

  if (!dbConfigured()) {
    return (
      <>
        {heading}
        <RestoranTabs role={role} />
        <DbOffline />
      </>
    );
  }

  after(() => retryPendingNotifications());

  let tables: TableRequest[] = [];
  let focused: TableRequest | null = null;
  let histories: Record<string, StatusLogEntry[]> = {};
  let settings: RestaurantSettings | null = null;
  let counts: { orders: number; tables: number } | null = null;
  let error: string | null = null;
  try {
    [tables, settings, counts] = await Promise.all([
      listTables(filter.id, { tests: withTests, limit: LIMIT }),
      readSettings(),
      countNewOrders(),
    ]);
    if (focusId && !tables.some((x) => x.id === focusId)) focused = await getTable(focusId);
    const ids = [...tables.map((x) => x.id), ...(focused ? [focused.id] : [])];
    histories = Object.fromEntries(await historyFor("table", ids));
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  // «Сегодня» считает сервер по Ташкенту: у телефона официанта может стоять другой пояс.
  const today = tashkentNow().date;

  return (
    <>
      {heading}
      <RestoranTabs role={role} counts={counts} />

      {error || !settings ? (
        <StoreError message={error ?? "нет настроек"} />
      ) : (
        <>
          <div className="mb-6 space-y-3">
            <TelegramNotice ready={telegramReady()} chats={restaurantChats(settings).length} />
            <StateNotice settings={settings} role={role} kind="tables" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {FILTERS.map((x) => (
              <FilterLink key={x.id} href={href(x.id, withTests)} on={x.id === filter.id}>
                {x.label}
              </FilterLink>
            ))}
            <Link
              href={href(filter.id, !withTests)}
              prefetch={false}
              className="ml-auto inline-flex items-center gap-2 px-1 py-1.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <span
                aria-hidden
                className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none ${
                  withTests ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[color:var(--line-strong)]"
                }`}
              >
                {withTests ? "✓" : ""}
              </span>
              показывать тестовые
            </Link>
          </div>

          {focused && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Бронь по ссылке — в фильтр «{filter.label}» не входит
              </p>
              <TablesList tables={[focused]} histories={histories} highlight={focusId} today={today} filterLabel={filter.label} />
            </div>
          )}

          <p className="mb-3 text-sm text-[var(--muted)]">
            {tables.length} {plural(tables.length, "бронь", "брони", "броней")}
            {counts && counts.tables > 0 ? ` · новых всего: ${counts.tables}` : ""}
            {tables.length >= LIMIT ? ` · показаны первые ${LIMIT}` : ""}
          </p>

          <TablesList tables={tables} histories={histories} highlight={focusId} today={today} filterLabel={filter.label} />

          <AutoRefresh />
          {focusId && <ScrollToCard id={`t-${focusId}`} />}
        </>
      )}
    </>
  );
}
