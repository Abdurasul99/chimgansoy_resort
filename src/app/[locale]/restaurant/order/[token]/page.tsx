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
import { IkatBand, Rosette } from "@/components/restaurant/Ornaments";
import { RestIcon } from "@/components/restaurant/RestIcon";

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

  return (
    <div className="rest bg-[#fcf4e6]">
      {!final && <AutoRefresh />}
      <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-[#140f0c] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_80%_0%,rgba(255,106,43,0.45),transparent_60%)]" />
        <Rosette size={380} className="rest-spin pointer-events-none absolute -right-36 -top-32 -z-10 opacity-[0.14]" />
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-28 sm:px-6 sm:pt-36">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#ffc46b]">
            {name} · {order ? `${s.order} #${order.number}` : `${s.table} #${table!.number}`}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,8vw,4.8rem)] font-bold italic leading-[0.92]">
            <span className={failed ? "text-[#ff8a6b]" : "rest-flame-text"}>{labels.title}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-white/75">{labels.text}</p>
          {again && (
            <p className="mt-4 max-w-xl rounded-2xl border border-[#ffa53d]/40 bg-[#ff6a2b]/15 px-4 py-3 text-sm font-semibold text-white">
              {s.again_note}
            </p>
          )}
          {failed && reason && locale === "ru" && (
            <p className="mt-3 text-sm text-white/60">
              {s.reason}: {reason}
            </p>
          )}
          {(order?.isTest || table?.isTest) && (
            <p className="mt-4 inline-flex rounded-full bg-[#17a3b0] px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider">{s.test}</p>
          )}

          {!failed && (
            <ol className="mt-8 flex items-start">
              {stepKeys.map((k, i) => {
                const done = i <= reached;
                const current = i === reached && !final;
                return (
                  <li key={k} className="flex flex-1 flex-col items-center text-center">
                    <div className="flex w-full items-center">
                      <span className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : done ? "bg-gradient-to-r from-[#ffa53d] to-[#ff6a2b]" : "bg-white/15"}`} />
                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                          done ? "bg-gradient-to-br from-[#ffa53d] to-[#d6352b] text-white" : "bg-white/10 text-white/50"
                        } ${current ? "rest-live" : ""}`}
                      >
                        {done && !current ? <RestIcon name="check" className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={`h-1 flex-1 rounded-full ${i === stepKeys.length - 1 ? "opacity-0" : i < reached ? "bg-gradient-to-r from-[#ff6a2b] to-[#ffa53d]" : "bg-white/15"}`} />
                    </div>
                    <span className={`mt-2 text-[11px] font-bold leading-tight sm:text-xs ${done ? "text-white" : "text-white/45"}`}>{stepNames[i]}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <IkatBand height={16} animated />
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="ym-hide-content mx-auto grid max-w-3xl gap-4">
          <div className="rounded-[2rem] border border-[#ecdcc0] bg-white p-6 sm:p-8">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.placed}</dt>
                <dd className="mt-1 font-bold text-[#1f1712]">{placed(order ? order.createdAt : table!.createdAt)}</dd>
              </div>
              {order && (
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.mode}</dt>
                  <dd className="mt-1 font-bold text-[#1f1712]">
                    {t.modes[order.mode].title}
                    {order.mode === "room" && order.details.unitType
                      ? ` · ${order.details.unitType === "aframe" ? "A-frame" : "Chalet"} №${order.details.unitNo ?? ""}`
                      : ""}
                  </dd>
                </div>
              )}
              {order?.mode === "delivery" && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{t.checkout.address}</dt>
                  <dd className="mt-1 font-bold text-[#1f1712]">{[order.details.locality, order.details.address].filter(Boolean).join(", ")}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.when}</dt>
                <dd className="mt-1 font-bold text-[#1f1712]">
                  {order ? when(order.desiredTime, t.checkout.asap) : when(`${table!.date} ${table!.time}`, "")}
                </dd>
              </div>
              {order?.confirmedTime && (
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.confirmedAt}</dt>
                  <dd className="mt-1 font-bold text-[#2c9a5b]">{order.confirmedTime}</dd>
                </div>
              )}
              {(table || order?.details.guests) && (
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.guests}</dt>
                  <dd className="mt-1 font-bold text-[#1f1712]">
                    {table ? `${table.adults}${table.kids ? ` + ${table.kids}` : ""}` : order?.details.guests}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{t.checkout.phone}</dt>
                <dd className="mt-1 font-bold text-[#1f1712]">{maskPhone(order ? order.phone : table!.phone)}</dd>
              </div>
            </dl>
          </div>

          {order && (
            <div className="rounded-[2rem] bg-[#1f1712] p-6 text-white sm:p-8">
              <p className="font-serif text-2xl font-bold">{s.items}</p>
              <ul className="mt-4 divide-y divide-white/10">
                {order.items.map((i) => (
                  <li key={i.dishId} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span>
                      <span className="font-extrabold text-[#ffb35c]">{i.qty}×</span> {i.titleLocal || i.title}
                      {i.portion && <span className="text-white/50"> · {i.portion}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums">{money(i.qty * i.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffb35c]">{s.total}</span>
                <span className="font-serif text-3xl font-bold tabular-nums">
                  {money(order.total)} <span className="font-sans text-sm text-white/60">{currency}</span>
                </span>
              </div>
              {order.feePending && <p className="mt-1 text-right text-xs text-white/55">{s.feePending}</p>}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-[2rem] border border-[#ecdcc0] bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8a7867]">{s.contact}</p>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-1 block font-serif text-3xl font-bold text-[#1f1712] hover:text-[#c2410c]">
                {phone}
              </a>
              {!final && <p className="mt-1 text-xs text-[#8a7867]">{s.refresh} · {s.keepLink}</p>}
            </div>
            <Link
              href={localizePath(locale, "/restaurant/menu")}
              prefetch={false}
              className="btn-press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffa53d] via-[#ff6a2b] to-[#d6352b] px-6 font-extrabold text-white"
            >
              <RestIcon name="menu" className="h-5 w-5" />
              {s.again}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
