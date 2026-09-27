"use client";

import Link from "next/link";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

/**
 * Ссылка-плитка, у которой свечение следует за курсором или пальцем.
 * Координаты пишутся в style самой плитки (--mx/--my), а не в корень
 * документа: так перерисовывается одна плитка, а не вся страница.
 */
export function GlowLink({
  href,
  className = "",
  children,
  style,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const move = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Link href={href} prefetch={false} onPointerMove={move} onClick={onClick} className={`rest-tile ${className}`} style={style}>
      {children}
    </Link>
  );
}
