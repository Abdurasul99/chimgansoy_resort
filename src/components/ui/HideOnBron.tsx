"use client";

import { usePathname } from "next/navigation";

/**
 * Hides its children on the booking page (/ru|uz|en/bron). Per Exely's guidance,
 * the booking page should be free of distractions (social links, the floating
 * contact/FAQ widget) that pull users out of the booking flow — and on mobile the
 * floating widget overlaps the booking cart. Wraps server components fine: they're
 * rendered on the server and passed in as already-evaluated children.
 */
export function HideOnBron({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/\/bron\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
