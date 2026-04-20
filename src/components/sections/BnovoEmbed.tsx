import { bnovoIntegration } from "@/content/integrations";
import type { Locale } from "@/i18n/config";
import { buildBnovoIframeUrl, type SearchParams } from "@/lib/bnovo";

type BnovoEmbedProps = {
  locale: Locale;
  searchParams?: SearchParams;
};

const copy = {
  ru: {
    ready: "Модуль Bnovo подключен через iframe URL.",
    pending: "Bnovo готов к подключению",
    body: "Добавьте официальный iframe URL из кабинета Bnovo в NEXT_PUBLIC_BNOVO_IFRAME_URL. UID можно хранить в NEXT_PUBLIC_BNOVO_UID для документации интеграции.",
    uid: "UID будет подставлен после выдачи данных Bnovo.",
  },
  uz: {
    ready: "Bnovo moduli iframe URL orqali ulangan.",
    pending: "Bnovo ulanishga tayyor",
    body: "Bnovo kabinetidan olingan rasmiy iframe URL ni NEXT_PUBLIC_BNOVO_IFRAME_URL ga qo'shing. UID integratsiya hujjati uchun NEXT_PUBLIC_BNOVO_UID da saqlanishi mumkin.",
    uid: "UID Bnovo ma'lumotlari berilgandan keyin qo'shiladi.",
  },
  en: {
    ready: "Bnovo module is connected through iframe URL.",
    pending: "Bnovo is ready to connect",
    body: "Add the official iframe URL from the Bnovo account to NEXT_PUBLIC_BNOVO_IFRAME_URL. UID can be kept in NEXT_PUBLIC_BNOVO_UID for integration documentation.",
    uid: "UID will be added after Bnovo provides the integration data.",
  },
};

export function BnovoEmbed({ locale, searchParams }: BnovoEmbedProps) {
  const iframeUrl = process.env.NEXT_PUBLIC_BNOVO_IFRAME_URL;
  const uid = process.env.NEXT_PUBLIC_BNOVO_UID;
  const dict = copy[locale];

  if (iframeUrl) {
    return (
      <div id="bnovo-widget" className="mt-6 overflow-hidden rounded-[8px] border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-5 py-3 text-xs font-bold uppercase text-[var(--accent-strong)]">
          {dict.ready}
        </div>
        <iframe
          title="Bnovo booking module"
          src={buildBnovoIframeUrl(iframeUrl, searchParams)}
          className="h-[760px] w-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      id="bnovo-widget"
      data-bnovo-placeholder="replace-with-official-bnovo-iframe-url"
      data-bnovo-env-url={bnovoIntegration.env.iframeUrl}
      data-bnovo-env-uid={bnovoIntegration.env.uid}
      className="mt-6 rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-5"
    >
      <p className="text-sm font-bold uppercase text-[var(--accent-strong)]">{dict.pending}</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{dict.body}</p>
      <p className="mt-3 text-xs font-bold uppercase text-[var(--muted)]">
        {uid ? `Bnovo UID: ${uid}` : dict.uid}
      </p>
    </div>
  );
}
