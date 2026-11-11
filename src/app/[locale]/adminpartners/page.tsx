import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PARTNERS_COOKIE, sessionValid } from "@/lib/partners/auth";
import { STATUS_LABEL, isExpired, type Offer } from "@/lib/partners/model";
import * as store from "@/lib/partners/store";
import { localizedUrl } from "@/i18n/domains";
import { CopyLink, LoginForm } from "./AdminClient";
import { signOutPartners } from "./actions";

/**
 * Админка партнёров — chimgandarbaza.uz/ru/adminpartners.
 *
 * Не в основной панели на chimgansoy.com: владелец хочет всё партнёрское на
 * основном домене (11.11.2026). Свой пароль и своя защита — lib/partners/auth.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Партнёры — админка" },
  robots: { index: false, follow: false },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const tone: Record<Offer["status"], string> = {
  draft: "bg-[var(--surface)] text-[var(--ink)]/70",
  sent: "bg-sky-100 text-sky-900",
  opened: "bg-amber-100 text-amber-900",
  negotiation: "bg-orange-100 text-orange-900",
  contract: "bg-emerald-100 text-emerald-900",
  declined: "bg-red-100 text-red-800",
};

export default async function AdminPartnersPage() {
  if (!sessionValid((await cookies()).get(PARTNERS_COOKIE)?.value)) {
    return (
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        <LoginForm />
      </section>
    );
  }

  let offers: Offer[] = [];
  let error = "";
  try {
    offers = await store.listOffers();
  } catch (e) {
    console.error("[adminpartners] list:", e);
    error = "База недоступна — список не загрузился. Попробуйте обновить страницу через минуту.";
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)]">Партнёрские предложения</h1>
          <p className="mt-1 text-sm text-[var(--ink)]/60">
            Общая страница для всех:{" "}
            <a href={localizedUrl("ru", "/partners")} target="_blank" rel="noopener" className="underline">
              chimgandarbaza.uz/ru/partners
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ru/adminpartners/new" className="rounded-full bg-[var(--sun)] px-5 py-2.5 text-sm font-bold text-[var(--ink)]">
            + Новое предложение
          </Link>
          <form action={signOutPartners}>
            <button className="rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-sm font-semibold">Выйти</button>
          </form>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}

      {!error && offers.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-[var(--line-strong)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--ink)]">Пока ни одного предложения</p>
          <p className="mt-2 text-sm text-[var(--ink)]/60">
            Создайте первое: компания, программы, до трёх пакетов с ценой — и получите ссылку для отправки.
          </p>
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {offers.map((o) => {
          const url = localizedUrl("ru", `/partners/o/${o.key}`);
          return (
            <li key={o.id} className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/ru/adminpartners/${o.id}`} className="text-xl font-bold text-[var(--ink)] hover:underline">
                    {o.company}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-2.5 py-1 ${tone[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    {o.revoked && <span className="rounded-full bg-red-600 px-2.5 py-1 text-white">Ссылка отозвана</span>}
                    {isExpired(o) && <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-white">Срок истёк</span>}
                  </div>
                </div>
                <div className="text-right text-sm text-[var(--ink)]/70">
                  <p>
                    Открытий: <b className="text-[var(--ink)]">{o.views}</b>
                  </p>
                  <p>Последнее: {fmt(o.lastViewedAt)}</p>
                  {o.contractRequestedAt && <p className="font-semibold text-[var(--accent)]">Запросил договор: {fmt(o.contractRequestedAt)}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <code className="min-w-0 max-w-full truncate rounded-lg bg-[var(--surface)] px-3 py-2 text-xs">{url}</code>
                <CopyLink url={url} />
                <a href={url} target="_blank" rel="noopener" className="text-sm font-semibold underline">
                  Открыть
                </a>
                <Link href={`/ru/adminpartners/${o.id}`} className="text-sm font-semibold underline">
                  Изменить
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
