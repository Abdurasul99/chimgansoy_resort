"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/admin-auth";

type Counts = { orders: number; tables: number };

/**
 * Вкладки раздела. Администратор сайта видит в общей навигации один пункт
 * «Ресторан» — без этих вкладок ему не добраться до столов и меню. Золотые
 * счётчики — новые, ещё никем не взятые заказы и брони.
 */
export function RestoranTabs({ role, counts }: { role: AdminRole; counts?: Counts | null }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/restoran", label: "Заказы", badge: counts?.orders ?? 0 },
    { href: "/admin/restoran/stoly", label: "Столы", badge: counts?.tables ?? 0 },
    ...(role === "owner" || role === "manager"
      ? [
          { href: "/admin/restoran/menu", label: "Меню", badge: 0 },
          { href: "/admin/restoran/nastroyki", label: "Настройки", badge: 0 },
        ]
      : []),
  ];

  return (
    <nav aria-label="Разделы ресторана" className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const on = t.href === "/admin/restoran" ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch={false}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              on
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "border border-[color:var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span
                className="rounded-full bg-[var(--sun)] px-2 py-0.5 text-[11px] font-extrabold leading-none text-[var(--on-accent)]"
                aria-label={`новых: ${t.badge}`}
              >
                {t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
