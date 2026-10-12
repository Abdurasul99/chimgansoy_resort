import type { LocalizedString } from "@/content/types";

/**
 * Модель ресторана «Сазанчик» — типы и допустимые значения.
 *
 * С 12.10.2026 раздел — меню и фотогалерея, без заказов, броней столов и
 * Telegram-бота (решение владельца). Заказы с корзиной, оформлением и статусами
 * жили здесь с 26.09.2026 — вернуть их можно из истории git, коммит 6fc4ea5.
 *
 * Меню, цены, наличие и настройки лежат в базе, а не в src/content: их меняет
 * ресторан без программиста. Таблицы restaurant_orders, restaurant_tables и
 * restaurant_status_log в базе остались (пустые) — код их больше не трогает.
 */

/**
 * Наличие позиции.
 *  • available — есть;
 *  • unavailable — временно нет: видна в меню с пометкой;
 *  • preorder — готовится по предварительному заказу, по телефону.
 */
export const AVAILABILITY = ["available", "unavailable", "preorder"] as const;
export type Availability = (typeof AVAILABILITY)[number];

/** Публикация позиции. Архив прячет блюдо, которое больше не готовят, не удаляя его. */
export const DISH_STATES = ["published", "hidden", "archived"] as const;
export type DishState = (typeof DISH_STATES)[number];

export type Category = {
  id: number;
  title: LocalizedString;
  sort: number;
  visible: boolean;
};

export type Dish = {
  id: number;
  categoryId: number | null;
  title: LocalizedString;
  description: LocalizedString;
  /** «350 г», «1 шт», «0,5 л» — как напишет кухня. */
  portion: string;
  /** Сумы, целое. 0 — цена не указана, такую позицию не публикуют. */
  price: number;
  image: string;
  availability: Availability;
  state: DishState;
  sort: number;
};

/**
 * Видимость раздела. hidden — нет в меню сайта и в поиске, страница открывается
 * только по прямой ссылке; open — раздел виден всем. Прежнее «announce» (анонс
 * без заказов) после отказа от заказов ничем не отличается от open и читается
 * как open.
 */
export const RESTAURANT_STATES = ["hidden", "open"] as const;
export type RestaurantState = (typeof RESTAURANT_STATES)[number];

/** Сколько фото держит галерея. */
export const GALLERY_MAX = 30;

export type RestaurantSettings = {
  state: RestaurantState;
  name: LocalizedString;
  tagline: LocalizedString;
  about: LocalizedString;
  /** Строка наверху раздела: «Открытие 10 октября», «Сегодня кухня до 20:00». */
  announcement: LocalizedString;
  /** «HH:MM» или пусто — тогда часы не печатаются. */
  hoursOpen: string;
  hoursClose: string;
  /** Номера ресторана. Пусто — печатается общий номер комплекса. */
  phones: string[];
  instagram: string;
  telegram: string;
  /** Главное фото раздела; пусто — берётся кадр комплекса. */
  heroImage: string;
  /** Фотогалерея ресторана, по порядку показа. */
  gallery: string[];
};

export const EMPTY_LS: LocalizedString = { ru: "", uz: "", en: "" };
