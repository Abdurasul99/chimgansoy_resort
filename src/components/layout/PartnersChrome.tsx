"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contacts } from "@/content/contacts";

/**
 * Партнёрский раздел живёт без гостевой обвязки.
 *
 * Владелец, 11.11.2026: «сегмент B2B никак не пересекается с B2C». На
 * /partners, /partners/o/<ключ> и /adminpartners нет гостевой шапки с
 * «Забронировать», подвала с формой отдыха и ИИ-консьержа — вместо них своя
 * светлая шапка в палитре сайта (с 14.11.2026; до того была тёмной). Обёртки — клиентские, как HideOnBron: путь известен только
 * здесь, а сами шапка и подвал рендерятся на сервере и приходят готовыми.
 */
const PARTNERS_PATH = /^\/(ru|uz|en)\/(partners|adminpartners)(\/|$)/;

export function isPartnersPath(pathname: string): boolean {
  return PARTNERS_PATH.test(pathname);
}

export function HideOnPartners({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isPartnersPath(pathname)) return null;
  return <>{children}</>;
}

const LANGS = ["ru", "uz", "en"] as const;

export function PartnersHeader() {
  const pathname = usePathname();
  if (!isPartnersPath(pathname)) return null;
  const [, current = "ru", ...rest] = pathname.split("/");
  const admin = rest[0] === "adminpartners";
  const tail = rest.join("/");
  const label = { ru: "Партнёрам", uz: "Hamkorlar uchun", en: "For partners" }[current as "ru"] ?? "Партнёрам";
  // Лендинг и рабочая панель пока только на русском: переключатель языка там
  // вёл бы на ту же русскую страницу, поэтому вместо него — кнопка к расчёту.
  const b2b = rest[0] === "partners" && (rest.length === 1 || rest[1] === "" || rest[1] === "detail");
  const onDetail = rest[1] === "detail";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--glass-bg-strong)] text-[var(--ink)] backdrop-blur print:hidden">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href={admin ? "/ru/adminpartners" : `/${current}/partners`} className="min-w-0 leading-tight">
          <span className="block truncate font-serif text-lg font-bold tracking-wide sm:text-xl">
            CHIMGAN DARBAZA<span className="hidden sm:inline"> RESORT</span>
          </span>
          <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--sun-dark)]">
            {admin ? "Админка партнёров" : label}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <a href={`tel:${contacts.phone.replace(/\s/g, "")}`} className="hidden text-sm font-semibold text-[var(--ink)]/75 hover:text-[var(--ink)] md:block">
            {contacts.phone}
          </a>
          {b2b ? (
            <Link
              href={onDetail ? `/${current}/partners` : `/${current}/partners/detail#calculator`}
              className="rounded-full bg-[var(--sun)] px-4 py-2.5 text-sm font-bold text-[var(--on-accent)] transition hover:bg-[var(--sun-dark)] hover:text-white sm:px-5"
            >
              {onDetail ? (
                "← Лендинг"
              ) : (
                <>
                  <span className="sm:hidden">Расчёт →</span>
                  <span className="hidden sm:inline">Перейти к расчёту →</span>
                </>
              )}
            </Link>
          ) : (
            !admin && (
              <nav aria-label="Language" className="flex gap-1 text-xs font-bold">
                {LANGS.map((l) => (
                  <Link
                    key={l}
                    href={`/${l}/${tail}`}
                    aria-current={l === current ? "true" : undefined}
                    className={`rounded-full px-2.5 py-1.5 uppercase ${l === current ? "bg-[var(--ink)] text-white" : "text-[var(--ink)]/55 hover:text-[var(--ink)]"}`}
                  >
                    {l}
                  </Link>
                ))}
              </nav>
            )
          )}
        </div>
      </div>
    </header>
  );
}
