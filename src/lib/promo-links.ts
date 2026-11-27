import type { Promotion } from "@/content/promotions";
import { EXELY_ROOM_TYPE } from "@/content/rooms";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

/**
 * Куда ведут две кнопки акции — одинаково в блоке акций на главной и на
 * зимнем экране.
 *
 * Метка акции (slug) уходит в utm_content — в заявке видно, что сработало.
 * utm_medium — где стояла карточка: «offers» — главная, «winter» — зимний
 * экран; источник в заявке так и покажет «site · winter».
 */
export function promoLinks(promo: Promotion, locale: Locale, medium: "offers" | "winter") {
  const utm = `utm_source=site&utm_medium=${medium}&utm_content=${promo.slug}`;
  // «В один клик»: акция на один домик — к форме на его странице (якорь
  // zayavka), на любой домик — в каталог. Метка остаётся в адресе страницы с
  // формой и уходит в заявку полем page.
  const oneClick = promo.room
    ? `${localizePath(locale, `/nomera/${promo.room}`)}?${utm}#zayavka`
    : `${localizePath(locale, "/nomera")}?${utm}`;
  // Движок сразу на нужном домике, если акция на один домик.
  const roomType = promo.room ? EXELY_ROOM_TYPE[promo.room] : undefined;
  const engine = `${localizePath(locale, "/bron")}?${roomType ? `room-type=${roomType}&` : ""}${utm}`;
  return { oneClick, engine };
}
