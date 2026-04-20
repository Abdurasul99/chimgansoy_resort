import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "light";
  className?: string;
  icon?: "arrow" | "phone" | "whatsapp" | "telegram";
  external?: boolean;
};

const variants = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
  secondary: "bg-[var(--ink)] text-white hover:bg-[var(--green)]",
  ghost: "border border-[color:var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]",
  light: "bg-white/92 text-[var(--ink)] hover:bg-white",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  icon = "arrow",
  external = false,
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
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
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
