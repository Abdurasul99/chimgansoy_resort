"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The panel's navigation.
 *
 * The only client component in the admin frame, and only because the active
 * item has to be known from the URL. Putting the gate and the shell in the
 * layout means no page can render without a session — but a layout does not
 * receive the pathname, so this reads it.
 */

const NAV = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/zayavki", label: "Заявки" },
  { href: "/admin/analitika", label: "Аналитика" },
  { href: "/admin/tseny", label: "Цены" },
  { href: "/admin/uslugi", label: "Услуги" },
  { href: "/admin/novosti", label: "Новости" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:overflow-visible">
      {NAV.map((item) => {
        // Exact match for the dashboard, prefix for the rest — otherwise
        // "Сводка" stays lit on every screen, since every path starts /admin.
        const on = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              on
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
