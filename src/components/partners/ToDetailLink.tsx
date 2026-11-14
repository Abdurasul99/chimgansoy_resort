"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

/**
 * Переход с лендинга на рабочую панель. Отрасль и пакет едут в адресе
 * (?industry=…&pkg=…), панель их читает и подставляет в калькулятор; событие
 * partner_to_detail показывает, из какого блока лендинга ушли считать.
 */
export function ToDetailLink(props: {
  href: string;
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={props.href}
      className={props.className}
      onClick={() => {
        const url = new URL(props.href, "https://x.invalid");
        trackEvent("partner_to_detail", {
          source: props.source,
          target: url.hash.replace("#", "") || null,
          industry: url.searchParams.get("industry"),
          bonus: url.searchParams.get("bonus"),
        });
      }}
    >
      {props.children}
    </Link>
  );
}
