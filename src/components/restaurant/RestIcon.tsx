import type { ReactNode } from "react";

/**
 * Иконки ресторана. Рисованы в том же духе, что и Icon.tsx (24×24, линия
 * 1.8, скруглённые концы), но отдельно: в общем наборе нет ни корзины, ни
 * доставки, ни домика, а раздувать его ради одного раздела незачем.
 */
export type RestIconName =
  | "menu"
  | "table"
  | "delivery"
  | "room"
  | "takeaway"
  | "bag"
  | "plus"
  | "minus"
  | "clock"
  | "flame"
  | "search"
  | "close"
  | "phone"
  | "arrow"
  | "check"
  | "leaf"
  | "cloche";

const PATHS: Record<RestIconName, ReactNode> = {
  menu: (
    <>
      <path d="M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z" />
      <path d="M6 3v18M10 8h5M10 12h5M10 16h3" />
    </>
  ),
  table: (
    <>
      <path d="M3 9h18M5 9v11M19 9v11M8 9V6h8v3" />
      <path d="M9 14h6" />
    </>
  ),
  delivery: (
    <>
      <path d="M3 7h10v8H3zM13 10h4l3 3v2h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  room: (
    <>
      <path d="M3 20L12 4l9 16" />
      <path d="M7 20l5-9 5 9M3 20h18" />
    </>
  ),
  takeaway: (
    <>
      <path d="M5 8h14l-1.4 12H6.4z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.2 1.6.9 2.6 2 3.1C10.6 8.6 11 5.5 12 3z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: <path d="M6.6 3.5h2.6l1.4 4-2 1.3a11 11 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  leaf: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7" />,
  cloche: (
    <>
      <path d="M4 17a8 8 0 0 1 16 0zM2.5 17h19M12 9V7.5M10.5 7.5h3" />
      <path d="M4 20h16" />
    </>
  ),
};

export function RestIcon({ name, className = "h-5 w-5" }: { name: RestIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
