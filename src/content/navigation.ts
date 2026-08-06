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
      { href: "/nomera/pool", label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" } },
      { href: "/bron", label: { ru: "Забронировать", uz: "Bron qilish", en: "Book now" } },
      { href: "/novosti", label: { ru: "Новости", uz: "Yangiliklar", en: "News" } },
    ],
  },
  // Day products are sold again, each with its own request form. They get their
  // own group rather than sitting under "Размещение": a topchan and a tubing
  // pass are not places to sleep, and filing them there is what made the
  // catalogue read as a day-use price list the last time round.
  {
    title: { ru: "Отдых на день", uz: "Bir kunlik dam", en: "Day visit" },
    links: [
      { href: "/topchan", label: { ru: "Топчан", uz: "Topchan", en: "Topchan" } },
      { href: "/nomera/pool", label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" } },
      { href: "/tubing", label: { ru: "Тюбинг-горка", uz: "Tubing gorkasi", en: "Tubing hill" } },
    ],
  },
  {
    title: { ru: "Территория", uz: "Hudud", en: "Territory" },
    links: [
      { href: "/services/restaurant", label: { ru: "Кухня и меню", uz: "Oshxona va menyu", en: "Kitchen & menu" } },
      { href: "/services/outdoor-cooking", label: { ru: "Мангал и казан", uz: "Mangal va qozon", en: "BBQ & kazan" } },
      { href: "/services/picnic-zone", label: { ru: "Зоны отдыха", uz: "Dam olish zonalari", en: "Lounge areas" } },
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
