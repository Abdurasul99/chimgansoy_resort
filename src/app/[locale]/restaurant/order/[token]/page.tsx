import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contacts } from "@/content/contacts";
import { priceLabels } from "@/content/pricing";
import { restaurantText } from "@/content/restaurant";
import { localizePath } from "@/i18n/routing";
import { getLocaleParam } from "@/lib/content";
import { money } from "@/lib/tariff";
import { getRestaurantSettings } from "@/lib/restaurant/live";
import type { Order, TableRequest } from "@/lib/restaurant/model";
import { maskPhone, pickText } from "@/lib/restaurant/rules";
import { getOrderByToken, getTableByToken } from "@/lib/restaurant/store";
import { AutoRefresh } from "@/components/restaurant/AutoRefresh";

type PageProps = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

/**
 * Статус заказа или брони по секретной ссылке (ТЗ, п. 2: персональные данные —
 * только по защищённой ссылке). Токен — 144 бита случайности, не номер заказа:
 * перебрать соседние заказы нельзя. Телефон всё равно показан не целиком —
 * ссылкой могут поделиться.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const ORDER_STEPS = ["new", "confirmed", "cooking", "ready", "done"] as const;
const TABLE_STEPS = ["new", "confirmed", "done"] as const;

function when(value: string, asap: string): string {
  if (!value || value === "asap") return asap;
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})$/.exec(value);
  return m ? `${m[3]}.${m[2]}.${m[1]} · ${m[4]}` : value;
}

function placed(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t + 5 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export default async function RestaurantStatusPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const again = (await searchParams).again === "1";
  const locale = await getLocaleParam(params);
  let order: Order | null = null;
  let table: TableRequest | null = null;
  try {
    order = await getOrderByToken(token);
    if (!order) table = await getTableByToken(token);
  } catch (e) {
    console.error("[restaurant] статус не прочитан:", e);
  }
  if (!order && !table) notFound();

  const settings = await getRestaurantSettings();
  const t = restaurantText(locale);
  const s = t.status;
  const currency = priceLabels.currencyShort[locale];
  const phone = settings.phones[0] || contacts.phone;
  const name = pickText(settings.name, locale);

  const status = order ? order.status : table!.status;
  const labels = order ? s.order_labels[order.status] : s.table_labels[table!.status];
  const stepKeys: readonly string[] = order ? ORDER_STEPS : TABLE_STEPS;
  const stepNames = order ? s.steps : s.tableSteps;
  const failed = status === "cancelled" || status === "declined";
  const reached = failed ? -1 : stepKeys.indexOf(status);
  const final = failed || status === "done";
  const reason = order?.cancelReason || table?.cancelReason || "";

  const dt = "text-[13px] text-[#8c8c8c]";
  const dd = "mt-0.5 font-semibold text-[#1c1c1c]";

  return (
    <div className="rest bg-white">
      {!final && <AutoRefresh />}
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <p className="text-sm text-[#8c8c8c]">
          {name} · {order ? `${s.order} #${order.number}` : `${s.table} #${table!.number}`}
        </p>
        <h1 className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${failed ? "text-[#b42318]" : "text-[#1c1c1c]"}`}>{labels.title}</h1>
        <p className="mt-2 text-[15px] leading-6 text-[#6b6b6b]">{labels.text}</p>
        {again && <p className="mt-4 rounded-2xl bg-[#fff4e0] px-4 py-3 text-sm text-[#6b4700]">{s.again_note}</p>}
        {failed && reason && locale === "ru" && (
          <p className="mt-3 text-sm text-[#8c8c8c]">
            {s.reason}: {reason}
          </p>
        )}
        {(order?.isTest || table?.isTest) && (
          <p className="mt-4 inline-flex rounded-full bg-[#e7f5f6] px-3 py-1.5 text-xs font-semibold text-[#0e5f67]">{s.test}</p>
        )}

        {/* Ход заказа — полосками, как трекер в приложении доставки. */}
        {!failed && (
          <ol className="mt-7 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${stepKeys.length}, minmax(0, 1fr))` }}>
            {stepKeys.map((k, i) => {
              const done = i <= reached;
              const current = i === reached && !final;
              return (
                <li key={k}>
                  <span className={`block h-1.5 rounded-full ${done ? "bg-[#f4a52a]" : "bg-[#ececec]"} ${current ? "animate-pulse" : ""}`} />
                  <span className={`mt-2 block text-[11px] leading-tight sm:text-xs ${current ? "font-semibold text-[#1c1c1c]" : done ? "text-[#4a4a4a]" : "text-[#a8a8a8]"}`}>
                    {stepNames[i]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="ym-hide-content mt-8 grid gap-4">
          <div className="rounded-3xl border border-[#ececec] p-5 sm:p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className={dt}>{s.placed}</dt>
                <dd className={dd}>{placed(order ? order.createdAt : table!.createdAt)}</dd>
              </div>
              {order && (
                <div>
                  <dt className={dt}>{s.mode}</dt>
                  <dd className={dd}>
                    {t.modes[order.mode].title}
                    {order.mode === "room" && order.details.unitType
                      ? ` · ${order.details.unitType === "aframe" ? "A-frame" : "Chalet"} №${order.details.unitNo ?? ""}`
                      : ""}
                  </dd>
                </div>
              )}
              {order?.mode === "delivery" && (
                <div className="sm:col-span-2">
                  <dt className={dt}>{t.checkout.address}</dt>
                  <dd className={dd}>{[order.details.locality, order.details.address].filter(Boolean).join(", ")}</dd>
                </div>
              )}
              <div>
                <dt className={dt}>{s.when}</dt>
                <dd className={dd}>{order ? when(order.desiredTime, t.checkout.asap) : when(`${table!.date} ${table!.time}`, "")}</dd>
              </div>
              {order?.confirmedTime && (
                <div>
                  <dt className={dt}>{s.confirmedAt}</dt>
                  <dd className={`${dd} text-[#1a7f47]`}>{order.confirmedTime}</dd>
                </div>
              )}
              {(table || order?.details.guests) && (
                <div>
                  <dt className={dt}>{s.guests}</dt>
                  <dd className={dd}>{table ? `${table.adults}${table.kids ? ` + ${table.kids}` : ""}` : order?.details.guests}</dd>
                </div>
              )}
              <div>
                <dt className={dt}>{t.checkout.phone}</dt>
                <dd className={dd}>{maskPhone(order ? order.phone : table!.phone)}</dd>
              </div>
            </dl>
          </div>

          {order && (
            <div className="rounded-3xl bg-[#f6f5f2] p-5 sm:p-6">
              <p className="text-lg font-bold text-[#1c1c1c]">{s.items}</p>
              <ul className="mt-3 divide-y divide-[#e6e3dd] text-sm">
                {order.items.map((i) => (
                  <li key={i.dishId} className="flex items-baseline justify-between gap-4 py-2.5 text-[#1c1c1c]">
                    <span>
                      <span className="font-semibold">{i.qty} ×</span> {i.titleLocal || i.title}
                      {i.portion && <span className="text-[#8c8c8c]"> · {i.portion}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums">{money(i.qty * i.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t border-[#e6e3dd] pt-3 text-[#1c1c1c]">
                <span className="font-semibold">{s.total}</span>
                <span className="text-xl font-bold tabular-nums">
                  {money(order.total)} {currency}
                </span>
              </div>
              {order.feePending && <p className="mt-1 text-right text-xs text-[#8c8c8c]">{s.feePending}</p>}
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-3xl border border-[#ececec] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className={dt}>{s.contact}</p>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-0.5 block text-xl font-bold text-[#1c1c1c]">
                {phone}
              </a>
              {!final && (
                <p className="mt-1 text-xs text-[#8c8c8c]">
                  {s.refresh} · {s.keepLink}
                </p>
              )}
            </div>
            <Link
              href={localizePath(locale, "/restaurant")}
              prefetch={false}
              className="btn-press inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4a52a] px-6 font-bold text-[#3b2a0a]"
            >
              {s.again}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
