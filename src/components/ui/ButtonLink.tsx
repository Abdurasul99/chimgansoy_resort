import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "light";
  className?: string;
  icon?: "arrow" | "phone" | "whatsapp" | "telegram" | "instagram";
  external?: boolean;
  /** Same-tab full page navigation (plain <a>) — e.g. so the Exely engine
   *  embeds on the booking page, which only happens on a full load. */
  reload?: boolean;
};

const variants = {
  primary:
    "bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] text-[var(--on-accent)] shadow-[0_8px_22px_-6px_rgba(220,140,0,0.55)] hover:shadow-[0_14px_30px_-6px_rgba(220,140,0,0.65)] hover:brightness-[1.03]",
  secondary: "bg-[var(--mountain)] text-white hover:bg-slate-700 shadow-[0_8px_22px_-8px_rgba(30,41,59,0.5)]",
  ghost: "border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)] hover:text-[var(--sun-dark)] hover:bg-[var(--sun)]/5",
  light: "bg-[var(--paper)] text-[var(--ink)] ring-1 ring-[color:var(--line)] hover:bg-[var(--surface)] shadow-sm",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  icon = "arrow",
  external = false,
  reload = false,
}: ButtonLinkProps) {
  const content = (
    <>
      <span>{children}</span>
      <Icon name={icon} className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
    </>
  );

  const classes = `group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)]/55 ${variants[variant]} ${className}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  if (reload) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
