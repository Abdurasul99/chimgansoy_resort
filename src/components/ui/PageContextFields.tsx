"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Скрытые поля с контекстом обращения: с какой страницы гость написал и откуда
 * пришёл на сайт.
 *
 * Оператор получал «💬 Новый вопрос — Имя, Телефон» и не понимал, о чём вопрос:
 * приходилось звонить и спрашивать заново. Половину контекста даёт сам текст
 * вопроса (теперь он обязателен), вторую — адрес страницы.
 *
 * Метки utm запоминаются ОТДЕЛЬНО от страницы, и вот почему. Они живут только
 * в адресе той страницы, на которую человек приземлился. Гость открывает
 * ссылку из шапки Instagram, попадает на главную с метками, ходит по сайту и
 * оставляет заявку на странице глэмпинга — там в адресе уже пусто. До
 * 24.08.2026 источник в таких заявках терялся, а это почти все заявки: на
 * странице приземления форму заполняют редко.
 *
 * Поэтому метки кладутся в sessionStorage при первом же появлении и потом
 * прикладываются к каждой форме. Запоминается ПЕРВЫЙ источник за визит: он
 * отвечает на вопрос «что привело гостя», а не «по какой ссылке он ходил
 * внутри сайта».
 *
 * Хранилище может быть недоступно — приватное окно, запрет сторонних данных,
 * старый браузер. Тогда поле просто останется пустым: заявка важнее метки.
 */
const KEY = "cd_traffic_source";
const MARKS = /^(utm_|gclid|yclid|fbclid)/i;

function readStored(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberSource(search: string): string {
  const params = new URLSearchParams(search);
  const marks = new URLSearchParams();
  for (const [key, value] of params) if (MARKS.test(key)) marks.set(key, value);

  const found = marks.toString();
  const stored = readStored();
  // Первый источник за визит побеждает: перезаписывать его переходом внутри
  // сайта значит потерять ответ на вопрос, откуда гость вообще взялся.
  if (!found || stored) return stored;

  try {
    sessionStorage.setItem(KEY, found);
  } catch {
    // Хранилище недоступно — источник доживёт хотя бы до отправки с этой страницы.
  }
  return found;
}

export function PageContextFields() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    // Параметры читаются из window, а НЕ через useSearchParams: тот хук
    // выкидывает всю страницу из статической генерации — на этом однажды
    // перестала собираться страница «О нас» из-за формы в подвале.
    const search = window.location.search;
    setQuery(search);
    setSource(rememberSource(search));
  }, [pathname]);

  return (
    <>
      <input type="hidden" name="page" value={`${pathname}${query}`} />
      <input type="hidden" name="source" value={source} />
    </>
  );
}
