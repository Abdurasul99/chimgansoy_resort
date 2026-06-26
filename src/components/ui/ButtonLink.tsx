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
  primary: "bg-[var(--sun)] text-[var(--on-accent)] hover:bg-[var(--sun-dark)] shadow-sm",
  secondary: "bg-[var(--mountain)] text-white hover:bg-slate-700",
  ghost: "border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)] hover:text-[var(--sun-dark)]",
  light: "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface)] shadow-sm",
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

  const classes = `group inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-sm font-semibold transition duration-300 ${variants[variant]} ${className}`;

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
