import Link from "next/link";
import type { AdminRole } from "@/lib/admin-auth";
import type { RestaurantSettings } from "@/lib/restaurant/model";
import { MODE_LABEL } from "@/lib/restaurant/labels";
import { openModes } from "@/lib/restaurant/rules";
import { Notice } from "./ui";

/**
 * Предупреждения над списками заказов и столов.
 *
 * Пустой список при закрытом разделе и пустой список, потому что гостей нет, —
 * для персонала выглядят одинаково. Поэтому состояние раздела и доставка в
 * Telegram печатаются прямо над списком, а не только в настройках.
 */

export function TelegramNotice({ ready, chats }: { ready: boolean; chats: number }) {
  if (!ready) {
    return (
      <Notice title="Telegram не подключён — заказы сюда приходят, в чат нет">
        Не задан токен бота (<code>TELEGRAM_RESTAURANT_BOT_TOKEN</code> или <code>TELEGRAM_STAFF_BOT_TOKEN</code>). Заказы сохраняются и видны на
        этой странице, но уведомлений в Telegram не будет — держите страницу открытой.
      </Notice>
    );
  }
  if (chats === 0) {
    return (
      <Notice title="Не задан чат для заказов">
        Бот есть, но слать некуда: укажите группу ресторана в <code>TELEGRAM_RESTAURANT_CHAT_ID</code> или
        чат комплекса в <code>TELEGRAM_ADMIN_CHAT_ID</code>. До этого заказы видны только здесь.
      </Notice>
    );
  }
  return null;
}

export function StateNotice({
  settings,
  role,
  kind,
}: {
  settings: RestaurantSettings;
  role: AdminRole;
  kind: "orders" | "tables";
}) {
  const settingsLink =
    role === "owner" || role === "manager" ? (
      <>
        {" "}
        <Link href="/admin/restoran/nastroyki" prefetch={false} className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">
          Настройки
        </Link>
      </>
    ) : null;

  if (settings.state === "hidden") {
    return (
      <Notice tone="info" title="Раздел скрыт от гостей">
        Ресторана нет в меню сайта и в поиске, страница открывается только по прямой ссылке. Заказов с
        сайта не будет — кроме тестовых из предпросмотра.
        {settingsLink}
      </Notice>
    );
  }
  if (settings.state === "announce") {
    return (
      <Notice tone="info" title="Анонс: заказы с сайта закрыты">
        Меню и страницы видны гостям, но оформить заказ или бронь стола нельзя.
        {settingsLink}
      </Notice>
    );
  }

  if (kind === "tables") {
    return settings.tables ? null : (
      <Notice title="Брони столов с сайта выключены">
        Раздел открыт, но форма брони стола не принимает заявки.
        {settingsLink}
      </Notice>
    );
  }

  const modes = openModes(settings);
  return modes.length === 0 ? (
    <Notice title="Раздел открыт, но ни один способ заказа не включён">
      Гости видят меню, а оформить заказ не могут.
      {settingsLink}
    </Notice>
  ) : (
    <Notice tone="ok" title="Раздел открыт">
      Принимаются: {modes.map((m) => MODE_LABEL[m]).join(", ")}
      {settings.tables ? ", брони столов" : ""}.
    </Notice>
  );
}
