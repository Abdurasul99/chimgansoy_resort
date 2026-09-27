import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache, updateTag } from "next/cache";
import { cookies } from "next/headers";
import type { Category, Dish, RestaurantSettings } from "./model";
import { DEFAULT_SETTINGS } from "./rules";
import { publicMenu, readSettings } from "./store";
import { PREVIEW_COOKIE, verifyPreview } from "./preview";

/**
 * Чтение ресторана для публичных страниц.
 *
 * Никогда не бросает. База недоступна — раздел считается скрытым, меню
 * пустым: сайт комплекса не должен падать оттого, что у ресторана плохой день.
 * Кэш — минута и тег: правка в админке сбрасывает его сразу (updateTag), а
 * минута — страховка на случай, если сброс не дошёл.
 */
export const RESTAURANT_TAG = "restaurant";
/**
 * Отдельный тег для «виден ли ресторан на сайте»: его читает layout каждой
 * страницы. Под общим тегом каждое «нет в наличии» в меню сбрасывало бы все
 * статические страницы сайта сразу.
 */
export const LISTED_TAG = "restaurant-listed";

// Ошибки из кэшируемых функций не глотаются, а пробрасываются: unstable_cache
// не запоминает неудачу и продолжает отдавать прошлое значение. Иначе минутный
// сбой базы на час записал бы «ресторан скрыт» в меню всего сайта.
const cachedSettings = unstable_cache(async (): Promise<RestaurantSettings> => readSettings(), ["restaurant-settings-v2"], {
  revalidate: 60,
  tags: [RESTAURANT_TAG],
});

const cachedMenu = unstable_cache(
  async (): Promise<{ categories: Category[]; dishes: Dish[] }> => publicMenu(),
  ["restaurant-menu-v2"],
  { revalidate: 60, tags: [RESTAURANT_TAG] },
);

const cachedListed = unstable_cache(async (): Promise<boolean> => (await readSettings()).state !== "hidden", ["restaurant-listed-v2"], {
  revalidate: 3600,
  tags: [LISTED_TAG],
});

function logged(what: string, e: unknown) {
  console.error(`[restaurant] ${what} не прочитано:`, e instanceof Error ? e.message : e);
}

export const getRestaurantSettings = cache(async (): Promise<RestaurantSettings> => {
  try {
    return await cachedSettings();
  } catch (e) {
    logged("настройки", e);
    return { ...DEFAULT_SETTINGS };
  }
});

export const getRestaurantMenu = cache(async (): Promise<{ categories: Category[]; dishes: Dish[] }> => {
  try {
    return await cachedMenu();
  } catch (e) {
    logged("меню", e);
    return { categories: [], dishes: [] };
  }
});

/** Показывать ли ресторан в меню сайта, подвале и карте сайта. */
export const restaurantListed = cache(async (): Promise<boolean> => {
  try {
    return await cachedListed();
  } catch (e) {
    logged("признак «виден ли ресторан»", e);
    return false;
  }
});

/**
 * Предпросмотр: владелец открыл ссылку из админки и видит раздел, пока он
 * скрыт от гостей. Читает cookie — значит, страница становится динамической;
 * страницы ресторана и так динамические (наличие блюд меняется в течение дня).
 */
export async function isPreview(): Promise<boolean> {
  try {
    const jar = await cookies();
    return verifyPreview(jar.get(PREVIEW_COOKIE)?.value, "cookie");
  } catch {
    return false;
  }
}

/**
 * Настройки и предпросмотр вместе.
 *
 * Скрытый раздел не отвечает 404: ресторан живёт внутри сайта по адресу
 * /restaurant, и его ссылку раздают в рекламе, Instagram и QR-кодах (ТЗ,
 * п. 1) ещё до того, как пункт появится в меню сайта. «Скрыт» значит «не в
 * меню, не в поиске и без заказов»; заказы — только тестовые, из предпросмотра.
 */
export async function restaurantAccess(): Promise<{ settings: RestaurantSettings; preview: boolean }> {
  const [settings, preview] = await Promise.all([getRestaurantSettings(), isPreview()]);
  // Открытый раздел предпросмотр не нужен: иначе оставшаяся cookie помечала
  // бы тестовыми настоящие заказы владельца.
  return { settings, preview: preview && settings.state !== "open" };
}

/**
 * Сброс кэша после правки в админке. updateTag — только из server action,
 * поэтому запасной путь через revalidateTag, как в site-overrides.ts.
 */
export function expireRestaurant(opts: { listing?: boolean } = {}): void {
  const expire = (tag: string) => {
    try {
      updateTag(tag);
    } catch {
      revalidateTag(tag, "max");
    }
  };
  expire(RESTAURANT_TAG);
  // Меню сайта и подвал на всех страницах зависят только от того, виден ли
  // ресторан. Цена блюда их не касается, и пересобирать ради неё весь сайт
  // незачем.
  if (opts.listing) {
    expire(LISTED_TAG);
    revalidatePath("/", "layout");
  }
}
