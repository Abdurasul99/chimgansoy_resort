import type { NavigationItem } from "./types";

export const mainNavigation: NavigationItem[] = [
  {
    href: "/",
    label: { ru: "Главная", uz: "Bosh sahifa", en: "Home" },
  },
  {
    href: "/nomera",
    label: { ru: "Номера", uz: "Joylashuv", en: "Rooms" },
  },
  {
    href: "/services",
    label: { ru: "Сервисы", uz: "Xizmatlar", en: "Services" },
  },
  {
    href: "/about",
    label: { ru: "О курорте", uz: "Kurort haqida", en: "About" },
  },
  {
    href: "/place",
    label: { ru: "Места рядом", uz: "Atrofdagi joylar", en: "Attractions" },
  },
  {
    href: "/contact",
    label: { ru: "Контакты", uz: "Aloqa", en: "Contacts" },
  },
];

export const footerNavigation = [
  {
    title: { ru: "Размещение", uz: "Joylashuv", en: "Stay" },
    links: [
      { href: "/nomera/glamping", label: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" } },
      { href: "/nomera/cottage", label: { ru: "Коттеджи", uz: "Kottejlar", en: "Cottages" } },
      { href: "/bron", label: { ru: "Бронирование", uz: "Bron qilish", en: "Booking" } },
    ],
  },
  {
    title: { ru: "Территория", uz: "Hudud", en: "Resort" },
    links: [
      { href: "/services/restaurant", label: { ru: "Ресторан", uz: "Restoran", en: "Restaurant" } },
      { href: "/services/tapchan-zone", label: { ru: "Топчаны", uz: "Topchanlar", en: "Tapchan zone" } },
      { href: "/services/pool", label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" } },
      { href: "/services/experience", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
    ],
  },
  {
    title: { ru: "Информация", uz: "Ma'lumot", en: "Information" },
    links: [
      { href: "/legal/how-to-get-there", label: { ru: "Как добраться", uz: "Qanday borish", en: "How to get there" } },
      { href: "/legal/accommodation-rules", label: { ru: "Правила проживания", uz: "Yashash qoidalari", en: "Accommodation rules" } },
      { href: "/legal/payment-refund", label: { ru: "Оплата и возврат", uz: "To'lov va qaytarish", en: "Payment and refund" } },
      { href: "/legal/privacy-policy", label: { ru: "Конфиденциальность", uz: "Maxfiylik", en: "Privacy policy" } },
    ],
  },
];
