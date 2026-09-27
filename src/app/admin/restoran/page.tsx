import Link from "next/link";
import { after } from "next/server";
import { AdminHeading } from "../AdminShell";
import { getSession } from "@/lib/admin-auth";
import type { Order, RestaurantSettings, StatusLogEntry } from "@/lib/restaurant/model";
import { restaurantChats, retryPendingNotifications, telegramReady } from "@/lib/restaurant/notify";
import {
  countNewOrders,
  dbConfigured,
  getOrder,
  historyFor,
  listOrders,
  readSettings,
  type OrderFilter,
} from "@/lib/restaurant/store";
import { AutoRefresh, ScrollToCard } from "./AutoRefresh";
import { StateNotice, TelegramNotice } from "./Notices";
import { OrdersList } from "./OrdersList";
import { RestoranTabs } from "./RestoranTabs";
import { DbOffline, FilterLink, StoreError, plural } from "./ui";

/**
 * Заказы ресторана — экран, который персонал держит открытым всю смену.
 *
 * Фильтры — ссылками, как в «Журнале»: адрес можно сохранить на телефоне, и
 * «Новые» откроются сразу. Ссылка «Открыть в панели» из Telegram приходит с
 * ?o=id — такой заказ подсвечивается, а если текущий фильтр его прячет,
 * показывается отдельно над списком.
 */
export const dynamic = "force-dynamic";

const FILTERS: { id: OrderFilter; label: string }[] = [
  { id: "active", label: "В работе" },
  { id: "new", label: "Новые" },
  { id: "today", label: "Сегодня" },
  { id: "done", label: "Выполненные" },
  { id: "cancelled", label: "Отменённые" },
  { id: "all", label: "Все" },
];

const LIMIT = 200;

type Props = { searchParams: Promise<{ f?: string; tests?: string; o?: string }> };

function href(filter: OrderFilter, tests: boolean): string {
  return `/admin/restoran?f=${filter}${tests ? "&tests=1" : ""}`;
}

export default async function RestaurantOrdersPage({ searchParams }: Props) {
  const { f, tests, o } = await searchParams;
  const session = await getSession();
  const role = session?.role ?? "staff";
  const filter = FILTERS.find((x) => x.id === f) ?? FILTERS[0];
  const withTests = tests === "1";
  const focusId = /^\d{1,12}$/.test(o ?? "") ? Number(o) : null;

  const heading = (
    <AdminHeading
      title="Ресторан — заказы"
      hint="Заказы с сайта. Сначала позвоните гостю и подтвердите состав, время и стоимость — потом ведите статусы: гость видит их по своей ссылке, а карточка в Telegram меняется вместе с панелью."
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

  // Досылка того, что не ушло в Telegram, — уже после ответа, чтобы не держать страницу.
  after(() => retryPendingNotifications());

  let orders: Order[] = [];
  let focused: Order | null = null;
  let histories: Record<string, StatusLogEntry[]> = {};
  let settings: RestaurantSettings | null = null;
  let counts: { orders: number; tables: number } | null = null;
  let error: string | null = null;
  try {
    [orders, settings, counts] = await Promise.all([
      listOrders(filter.id, { tests: withTests, limit: LIMIT }),
      readSettings(),
      countNewOrders(),
    ]);
    if (focusId && !orders.some((x) => x.id === focusId)) focused = await getOrder(focusId);
    const ids = [...orders.map((x) => x.id), ...(focused ? [focused.id] : [])];
    histories = Object.fromEntries(await historyFor("order", ids));
  } catch (e) {
    // Пустой список здесь прочитали бы как «заказов нет» — говорим прямо.
    error = e instanceof Error ? e.message : "База не отвечает";
  }

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
            <StateNotice settings={settings} role={role} kind="orders" />
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
                Заказ по ссылке — в фильтр «{filter.label}» не входит
              </p>
              <OrdersList orders={[focused]} histories={histories} highlight={focusId} filterLabel={filter.label} />
            </div>
          )}

          <p className="mb-3 text-sm text-[var(--muted)]">
            {orders.length} {plural(orders.length, "заказ", "заказа", "заказов")}
            {counts && counts.orders > 0 ? ` · новых всего: ${counts.orders}` : ""}
            {orders.length >= LIMIT ? ` · показаны последние ${LIMIT}` : ""}
          </p>

          <OrdersList orders={orders} histories={histories} highlight={focusId} filterLabel={filter.label} />

          <AutoRefresh />
          {focusId && <ScrollToCard id={`o-${focusId}`} />}
        </>
      )}
    </>
  );
}
