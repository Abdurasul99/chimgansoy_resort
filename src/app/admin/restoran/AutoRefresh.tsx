"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Список сам подтягивает новое раз в 30 секунд.
 *
 * Официант держит страницу открытой на телефоне и обновлять её руками не
 * будет. Тик пропускается, пока вкладка скрыта или человек что-то вводит:
 * перерисовка посреди выбора причины отмены сбила бы ему фокус. Вернулся на
 * вкладку — обновляем сразу, не дожидаясь тика.
 */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const busy = () => {
      const el = document.activeElement;
      if (!el) return false;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest("details[open] form") !== null;
    };
    const tick = () => {
      if (document.visibilityState === "visible" && !busy()) router.refresh();
    };
    const timer = window.setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);

  return <p className="mt-6 text-xs text-[var(--muted)]">обновляется каждые {seconds} с</p>;
}

/**
 * Прокрутка к карточке из ссылки «Открыть в панели» в Telegram. Ссылка несёт
 * ?o=id, а не #якорь, поэтому браузер сам к ней не прокрутит.
 */
export function ScrollToCard({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [id]);
  return null;
}
