import { AdminHeading } from "../../AdminShell";
import { getSession } from "@/lib/admin-auth";
import type { RestaurantSettings } from "@/lib/restaurant/model";
import { ownRestaurantChats, restaurantBotReady, restaurantChats, telegramReady } from "@/lib/restaurant/notify";
import { countNewOrders, dbConfigured, readSettings } from "@/lib/restaurant/store";
import { RestoranTabs } from "../RestoranTabs";
import { DbOffline, NoAccess, Notice, StoreError } from "../ui";
import { HeroPhoto, PreviewTools, SettingsForm, TelegramTools } from "./SettingsForm";

export const dynamic = "force-dynamic";

/** «…4567» — чат узнаётся по хвосту, а целиком номер незачем светить на экране. */
function mask(id: string): string {
  return id.length > 4 ? `…${id.slice(-4)}` : id;
}

const RESTAURANT_BOT = "chimgandarbaza_restaurant_bot";

export default async function RestaurantSettingsPage() {
  const session = await getSession();
  const role = session?.role ?? "staff";
  const heading = (
    <AdminHeading
      title="Ресторан — настройки"
      hint="Видимость раздела, тексты, часы, способы заказа, Telegram и предпросмотр."
    />
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
  let counts: { orders: number; tables: number } | null = null;
  let error: string | null = null;
  try {
    [settings, counts] = await Promise.all([readSettings(), countNewOrders()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "База не отвечает";
  }

  const own = ownRestaurantChats();
  const chats = settings ? restaurantChats(settings) : [];

  return (
    <>
      {heading}
      <RestoranTabs role={role} counts={counts} />
      {error || !settings ? (
        <StoreError message={error ?? "нет настроек"} />
      ) : (
        <div className="space-y-5">
          <SettingsForm settings={settings} role={role} />

          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Фото первого экрана</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Только настоящий снимок ресторана или его блюд — чужие фото на сайт не ставим.
            </p>
            <div className="mt-4">
              <HeroPhoto url={settings.heroImage} />
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Telegram</h2>
            <div className="mt-3 space-y-3 text-sm leading-6">
              {!telegramReady() ? (
                <Notice title="Бот не подключён">
                  Не задан ни <code>TELEGRAM_RESTAURANT_BOT_TOKEN</code>, ни <code>TELEGRAM_STAFF_BOT_TOKEN</code> —
                  заказы сохраняются и видны в панели, но в Telegram не уходят.
                </Notice>
              ) : chats.length === 0 ? (
                <Notice title="Не задан чат для заказов">
                  Укажите <code>TELEGRAM_RESTAURANT_CHAT_ID</code> или <code>TELEGRAM_ADMIN_CHAT_ID</code>.
                </Notice>
              ) : (
                <Notice tone="ok" title={`Заказы уходят в ${chats.length} ${chats.length === 1 ? "чат" : "чата"}`}>
                  {own.length
                    ? `Группа ресторана: ${own.map(mask).join(", ")} · пишет ${restaurantBotReady() ? `@${RESTAURANT_BOT}` : "общий бот @chimgandarbaza_bot"}`
                    : "Своей группы у ресторана нет — заказы идут в чат комплекса."}
                  {own.length && settings.notifyHotel ? " · копия — в чат комплекса" : ""}
                </Notice>
              )}
              <p className="text-[var(--muted)]">
                Своя группа ресторана: добавьте в неё бота @{RESTAURANT_BOT} — он сразу напишет номер группы (с
                минусом), его же можно спросить командой <code>/id</code>. Этот номер — в{" "}
                <code>TELEGRAM_RESTAURANT_CHAT_ID</code> в файле <code>/etc/chimgandarbaza.env</code>, затем перезапуск
                службы. Кнопки статусов в карточке заказа работают только в этих чатах; ограничить конкретными
                сотрудниками — <code>TELEGRAM_RESTAURANT_STAFF_IDS</code>.
              </p>
              <TelegramTools />
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
            <h2 className="font-serif text-xl font-semibold">Предпросмотр и доступы</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Ссылка открывает раздел на сайте, даже пока он скрыт, — на сутки, в этом браузере. Заказы из
              предпросмотра помечаются «ТЕСТ» и кухней не готовятся. Публичный адрес:{" "}
              <a href="https://chimgandarbaza.uz/ru/restaurant" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">
                chimgandarbaza.uz/ru/restaurant
              </a>
            </p>
            <div className="mt-4">
              <PreviewTools />
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              Входы для команды ресторана — в этой же панели, со своим паролем и именем:{" "}
              <code>RESTAURANT_MANAGER_PASSWORD</code> — меню, настройки, заказы и столы;{" "}
              <code>RESTAURANT_STAFF_PASSWORD</code> — только заказы и столы. Брони домиков, цены и заявки
              гостиницы им не видны.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
