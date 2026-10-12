import { AdminHeading } from "../../AdminShell";
import { getSession } from "@/lib/admin-auth";
import { GALLERY_MAX, type RestaurantSettings } from "@/lib/restaurant/model";
import { dbConfigured, readSettings } from "@/lib/restaurant/store";
import { RestoranTabs } from "../RestoranTabs";
import { DbOffline, NoAccess, StoreError } from "../ui";
import { GalleryManager } from "./GalleryManager";
import { HeroPhoto, PreviewTools, SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage() {
  const session = await getSession();
  const role = session?.role ?? "staff";
  const heading = (
    <AdminHeading title="Ресторан — настройки и фото" hint="Видимость раздела, тексты, часы, контакты, обложка, фотогалерея и предпросмотр." />
  );

  if (role !== "owner" && role !== "manager") {
    return (
      <>
        {heading}
        <RestoranTabs role={role} />
        <NoAccess />
      </>
    );
  }
  if (!dbConfigured()) {
    return (
      <>
        {heading}
        <RestoranTabs role={role} />
        <DbOffline />
      </>
    );
  }

  let settings: RestaurantSettings | null = null;
  let error: string | null = null;
  try {
    settings = await readSettings();
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  return (
    <>
      {heading}
      <RestoranTabs role={role} />
      {error || !settings ? (
        <StoreError message={error ?? "нет настроек"} />
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Фотогалерея</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Показывается на странице ресторана под меню, до {GALLERY_MAX} фото. Можно выбрать сразу несколько —
              загрузятся по очереди. Только настоящие снимки ресторана, зала и блюд.
            </p>
            <div className="mt-4">
              <GalleryManager photos={settings.gallery} />
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Фото первого экрана</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Обложка над названием ресторана. Только настоящий снимок ресторана или его блюд — чужие фото на сайт не ставим.
            </p>
            <div className="mt-4">
              <HeroPhoto url={settings.heroImage} />
            </div>
          </section>

          <SettingsForm settings={settings} role={role} />

          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Предпросмотр и доступы</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Ссылка открывает раздел на сайте, даже пока он скрыт, — на сутки, в этом браузере. Публичный адрес:{" "}
              <a href="https://chimgandarbaza.uz/ru/restaurant" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">
                chimgandarbaza.uz/ru/restaurant
              </a>
            </p>
            <div className="mt-4">
              <PreviewTools />
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              Входы для команды ресторана — в этой же панели, со своим паролем и именем:{" "}
              <code>RESTAURANT_MANAGER_PASSWORD</code> — меню, настройки и фото;{" "}
              <code>RESTAURANT_STAFF_PASSWORD</code> — только отметка «нет в наличии» в меню. Брони домиков, цены и
              заявки гостиницы им не видны.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
