"use client";

import { useEffect, useState } from "react";
import { recordOfferView, requestOfferContract } from "@/app/actions/partner-offer";

/**
 * Отметка «компания открыла предложение».
 *
 * Из браузера и через 3 секунды на видимой странице, а не при отрисовке на
 * сервере: ссылку, отправленную в Telegram или WhatsApp, мессенджер сам
 * открывает ради превью — серверный счётчик слал бы в группу «Uzum открыл»
 * в ту же секунду, как ссылку отправили, а не когда её прочли.
 */
export function OfferBeacon({ offerKey }: { offerKey: string }) {
  useEffect(() => {
    let sent = false;
    const fire = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      void recordOfferView(offerKey);
    };
    const t = setTimeout(fire, 3000);
    const onVis = () => {
      if (document.visibilityState === "visible") setTimeout(fire, 3000);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [offerKey]);
  return null;
}

type Labels = { request: string; requesting: string; requested: string };

export function ContractButton({ offerKey, index, labels }: { offerKey: string; index: number; labels: Labels }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | { error: string }>("idle");
  if (state === "ok") return <p role="status" className="text-sm font-semibold text-[var(--accent)]">{labels.requested}</p>;
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const r = await requestOfferContract(offerKey, index);
          setState(r.ok ? "ok" : { error: r.error });
        }}
        className="w-full rounded-full bg-[var(--sun)] px-5 py-3 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--sun-dark)] disabled:opacity-60"
      >
        {state === "busy" ? labels.requesting : labels.request}
      </button>
      {typeof state === "object" && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
    </div>
  );
}
