"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/admin-auth";

/**
 * Вкладки раздела. Администратор сайта видит в общей навигации один пункт
 * «Ресторан» — без этих вкладок ему не добраться до настроек. Сотруднику
 * ресторана достаётся только меню: он отмечает, чего сейчас нет.
 */
export function RestoranTabs({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/restoran/menu", label: "Меню" },
    ...(role === "owner" || role === "manager" ? [{ href: "/admin/restoran/nastroyki", label: "Настройки и фото" }] : []),
  ];

  return (
    <nav aria-label="Разделы ресторана" className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const on = pathname.startsWith(t.href);
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
          </Link>
        );
      })}
    </nav>
  );
}
