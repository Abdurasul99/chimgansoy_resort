"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Скрытое поле с контекстом обращения: с какой страницы гость написал.
 *
 * Оператор получал «💬 Новый вопрос — Имя, Телефон» и не понимал, о чём вопрос:
 * приходилось звонить и спрашивать заново. Половину контекста даёт сам текст
 * вопроса (теперь он обязателен), вторую — адрес страницы: «/ru/nomera/cottage»
 * отвечает на «о чём он» раньше, чем текст.
 *
 * Параметры адреса читаются из window, а НЕ через useSearchParams.
 * useSearchParams заставляет Next выкидывать всю страницу из статической
 * генерации — сборка на этом и упала: страница «О нас» перестала собираться
 * целиком из-за формы в подвале. Путь берётся хуком, потому что он есть и на
 * сервере, а строка запроса дописывается уже в браузере: заявку всё равно
 * отправляет человек, к этому моменту эффект давно отработал.
 */
export function PageContextFields() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(window.location.search);
  }, [pathname]);

  return <input type="hidden" name="page" value={`${pathname}${query}`} />;
}
