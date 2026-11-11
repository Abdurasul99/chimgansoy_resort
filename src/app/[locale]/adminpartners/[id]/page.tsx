import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { partnersPage } from "@/content/partners";
import { PARTNERS_COOKIE, sessionValid } from "@/lib/partners/auth";
import type { Offer } from "@/lib/partners/model";
import * as store from "@/lib/partners/store";
import { localizedUrl } from "@/i18n/domains";
import { CopyLink, LogoForm, OfferButtons, OfferForm } from "../AdminClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Предложение — админка партнёров" },
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function OfferEditPage({ params, searchParams }: Props) {
  if (!sessionValid((await cookies()).get(PARTNERS_COOKIE)?.value)) redirect("/ru/adminpartners");
  const { id } = await params;
  const { created } = await searchParams;

  let offer: Offer | null = null;
  if (id !== "new") {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) notFound();
    offer = await store.getOffer(n);
    if (!offer) notFound();
  }

  const programs = partnersPage.programs.items.map((p) => ({ id: p.id, title: p.title.ru }));
  const links = offer
    ? (["ru", "uz", "en"] as const).map((l) => ({ l, url: localizedUrl(l, `/partners/o/${offer.key}`) }))
    : [];

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <Link href="/ru/adminpartners" className="text-sm font-semibold underline">
        ← Все предложения
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">{offer ? offer.company : "Новое предложение"}</h1>

      {offer && (
        <div className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          {created && <p className="font-semibold text-[var(--accent)]">Ссылка создана — отправьте её компании.</p>}
          {offer.revoked && <p className="font-semibold text-red-700">Ссылка отозвана: по ней страница не откроется.</p>}
          <div className="space-y-2">
            {links.map(({ l, url }) => (
              <div key={l} className="flex flex-wrap items-center gap-3">
                <span className="w-8 text-xs font-bold uppercase text-[var(--ink)]/60">{l}</span>
                <code className="min-w-0 max-w-full truncate rounded-lg bg-[var(--surface)] px-3 py-2 text-xs">{url}</code>
                <CopyLink url={url} />
                <a href={url} target="_blank" rel="noopener" className="text-sm font-semibold underline">Открыть</a>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--ink)]/70">
            Открытий: <b>{offer.views}</b> · первое: {fmt(offer.firstViewedAt)} · последнее: {fmt(offer.lastViewedAt)}
            {offer.contractRequestedAt && <> · <b className="text-[var(--accent)]">запросил договор {fmt(offer.contractRequestedAt)}</b></>}
          </p>
          <p className="text-xs text-[var(--ink)]/55">
            Ваши собственные открытия (пока вы вошли в эту админку) не считаются и не приходят в группу.
          </p>
        </div>
      )}

      {offer && (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Логотип компании</h2>
          <LogoForm offer={offer} />
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <OfferForm offer={offer} programs={programs} />
      </div>

      {offer && (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Ссылка</h2>
          <OfferButtons offer={offer} />
        </div>
      )}
    </section>
  );
}
