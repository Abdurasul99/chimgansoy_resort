"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Страница статуса обновляется сама, пока заказ не закрыт: гость не должен
 * жать «обновить», чтобы увидеть «готовится». Пока вкладка скрыта — пауза,
 * незачем дёргать сервер из кармана.
 */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, everyMs]);
  return null;
}
