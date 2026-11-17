import { notFound } from "next/navigation";

/**
 * Любой адрес под языком, которому не нашлось страницы (/ru/nomeraa,
 * /uz/about/x). Без этой ловушки Next показывал свою голую 404: белый экран,
 * «This page could not be found», без шапки и подвала. notFound() отдаёт
 * фирменную [locale]/not-found.tsx; неизвестный раздел верхнего уровня proxy
 * перехватывает ещё раньше — с кодом 404.
 */
export default function MissingPage() {
  notFound();
}
