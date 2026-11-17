import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/NotFoundView";

/**
 * Цель proxy для несуществующих адресов: отвечает фирменной 404 с кодом 404.
 *
 * Обычный путь — notFound() в странице — не годится: под [locale] стоит
 * loading.tsx, ответ уходит потоком, и код 200 отправлен раньше, чем
 * страница доходит до notFound(). Proxy знает списки заранее и переписывает
 * запрос сюда со статусом 404 (src/proxy.ts).
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function NotFoundPage() {
  return <NotFoundView />;
}
