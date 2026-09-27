import { AdminHeading } from "../../AdminShell";
import { getSession } from "@/lib/admin-auth";
import type { Category, Dish } from "@/lib/restaurant/model";
import { countNewOrders, dbConfigured, listCategories, listDishes } from "@/lib/restaurant/store";
import { MenuEditor } from "../MenuEditor";
import { RestoranTabs } from "../RestoranTabs";
import { DbOffline, NoAccess, StoreError } from "../ui";

/**
 * Меню ресторана: блюда, цены, наличие, фото.
 *
 * Счётчики сверху — то, что мешает открыть раздел: блюда без фото и без
 * перевода гость увидит первыми. Правка видна на сайте сразу — действия
 * сбрасывают кэш меню.
 */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ arhiv?: string }> };

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p
        className={`mt-1 font-serif text-2xl font-semibold tabular-nums ${
          warn && value > 0 ? "text-[var(--sun-dark)]" : "text-[var(--ink)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function RestaurantMenuPage({ searchParams }: Props) {
  const { arhiv } = await searchParams;
  const session = await getSession();
  const role = session?.role ?? "staff";

  const heading = (
    <AdminHeading
      title="Ресторан — меню"
      hint="Блюда, цены, наличие и фото. Сохранённое видно на сайте сразу. Нет перевода — гость увидит русский текст."
    />
  );

  // Proxy и layout сюда сотрудника не пустят; проверка — на случай, если их когда-нибудь поменяют.
  if (role !== "owner" && role !== "manager") {
    return (
      <>
        {heading}
        <RestoranTabs role={role} />
        <NoAccess />
      </>
    );
  }

  if (!dbConfigured()) {
    return (
      <>
        {heading}
        <RestoranTabs role={role} />
        <DbOffline />
      </>
    );
  }

  let categories: Category[] = [];
  let dishes: Dish[] = [];
  let counts: { orders: number; tables: number } | null = null;
  let error: string | null = null;
  try {
    [categories, dishes, counts] = await Promise.all([
      listCategories(),
      listDishes({ withArchived: true }),
      countNewOrders(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  const live = dishes.filter((d) => d.state !== "archived");
  const noUz = live.filter((d) => !d.title.uz.trim()).length;
  const noEn = live.filter((d) => !d.title.en.trim()).length;
  const noTranslation = live.filter((d) => !d.title.uz.trim() || !d.title.en.trim()).length;

  return (
    <>
      {heading}
      <RestoranTabs role={role} counts={counts} />

      {error ? (
        <StoreError message={error} />
      ) : (
        <>
          <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Всего" value={dishes.length} />
            <Stat label="Опубликовано" value={dishes.filter((d) => d.state === "published").length} />
            <Stat label="Скрыто" value={dishes.filter((d) => d.state === "hidden").length} />
            <Stat label="В архиве" value={dishes.length - live.length} />
            <Stat label="Без фото" value={live.filter((d) => !d.image).length} warn />
            <Stat label="Без перевода" value={noTranslation} warn />
          </div>
          <p className="mb-8 text-xs text-[var(--muted)]">
            Без фото и без перевода — считаются блюда вне архива{noTranslation > 0 ? ` · нет UZ: ${noUz} · нет EN: ${noEn}` : ""}.
          </p>

          <MenuEditor categories={categories} dishes={dishes} showArchived={arhiv === "1"} />
        </>
      )}
    </>
  );
}
