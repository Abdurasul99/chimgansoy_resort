import type { NavigationItem } from "./types";

export const mainNavigation: NavigationItem[] = [
  {
    href: "/",
    label: { ru: "Главная", uz: "Bosh sahifa", en: "Home" },
  },
  {
    href: "/nomera",
    label: { ru: "Номера", uz: "Xonalar", en: "Rooms" },
  },
  {
    href: "/services",
    label: { ru: "Услуги", uz: "Xizmatlar", en: "Services" },
  },
  {
    href: "/about",
    label: { ru: "О месте", uz: "Joy haqida", en: "About" },
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
    title: { ru: "Размещение", uz: "Yashash", en: "Stay" },
    links: [
      { href: "/nomera", label: { ru: "Номера", uz: "Xonalar", en: "Rooms" } },
      { href: "/nomera/glamping", label: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" } },
      { href: "/nomera/cottage", label: { ru: "Шале", uz: "Shale", en: "Chalet" } },
      { href: "/bron", label: { ru: "Забронировать", uz: "Bron qilish", en: "Book now" } },
    ],
  },
  {
    title: { ru: "Дневной отдых", uz: "Kunlik dam", en: "Day visit" },
    links: [
      { href: "/services/tapchan-zone", label: { ru: "Топчаны и курпача", uz: "Topchan va kurpacha", en: "Topchan & kurpacha" } },
      { href: "/services/outdoor-cooking", label: { ru: "Мангал и казан", uz: "Mangal va qozon", en: "BBQ & kazan" } },
    ],
  },
  {
    title: { ru: "Территория", uz: "Hudud", en: "Territory" },
    links: [
      { href: "/services/restaurant", label: { ru: "Ресторан", uz: "Restoran", en: "Restaurant" } },
      { href: "/services/picnic-zone", label: { ru: "Зона пикника", uz: "Piknik zonasi", en: "Picnic zone" } },
      { href: "/services/experience", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
      { href: "/place", label: { ru: "Места рядом", uz: "Atrofdagi joylar", en: "Nearby attractions" } },
    ],
  },
  {
    title: { ru: "Информация", uz: "Ma'lumot", en: "Information" },
    links: [
      { href: "/legal/public-offer", label: { ru: "Публичная оферта", uz: "Ommaviy oferta", en: "Public offer" } },
      { href: "/legal/privacy-policy", label: { ru: "Политика конфиденциальности", uz: "Maxfiylik siyosati", en: "Privacy policy" } },
      { href: "/legal/payment-refund", label: { ru: "Возврат и отмена", uz: "Qaytarish va bekor qilish", en: "Refund & cancellation" } },
      { href: "/legal/how-to-get-there", label: { ru: "Как добраться", uz: "Qanday borish", en: "How to get there" } },
    ],
  },
];
