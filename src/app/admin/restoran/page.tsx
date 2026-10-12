import { redirect } from "next/navigation";

/**
 * Раздел «Ресторан» открывается меню.
 *
 * До 12.10.2026 здесь был список заказов; ресторан теперь показывает на сайте
 * только меню и фото, и заказов нет. Адрес /admin/restoran оставлен — на него
 * ведут вход ресторана (homeFor) и пункт общей навигации.
 */
export default function RestaurantAdminHome() {
  redirect("/admin/restoran/menu");
}
