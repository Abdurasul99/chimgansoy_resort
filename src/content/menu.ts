import type { LocalizedString } from "./types";

/**
 * The restaurant menu.
 *
 * Deliberately WITHOUT prices. The operator asked for that: a price on this
 * page is a price that has to be edited here, redeployed, and kept in step with
 * the kitchen — and when they are away nobody can do it. Dishes change far more
 * slowly than their prices, so the site lists what is cooked and the guest asks
 * the waiter or the administrator what it costs.
 *
 * Each group carries an icon key rendered by MenuBoard; they are drawn inline
 * rather than pulled from an icon set so the menu costs no extra request.
 */
export type MenuIcon =
  | "pizza"
  | "burger"
  | "sandwich"
  | "hotdog"
  | "snack"
  | "side"
  | "salad";

export type MenuGroup = {
  key: string;
  icon: MenuIcon;
  title: LocalizedString;
  items: LocalizedString[];
};

export const menuGroups: MenuGroup[] = [
  {
    key: "pizza",
    icon: "pizza",
    title: { ru: "Пицца", uz: "Pitsa", en: "Pizza" },
    items: [
      { ru: "Пепперони", uz: "Pepperoni", en: "Pepperoni" },
      { ru: "Комби", uz: "Kombi", en: "Combo" },
      { ru: "Курица с грибами", uz: "Tovuq va qo'ziqorin", en: "Chicken and mushroom" },
      { ru: "Маргарита", uz: "Margarita", en: "Margherita" },
    ],
  },
  {
    key: "burgers",
    icon: "burger",
    title: { ru: "Бургеры", uz: "Burgerlar", en: "Burgers" },
    items: [
      { ru: "Чизбургер", uz: "Chizburger", en: "Cheeseburger" },
      { ru: "Шницель бургер", uz: "Shnitsel burger", en: "Schnitzel burger" },
      { ru: "С рваной говядиной", uz: "Yirtilgan mol go'shti bilan", en: "Pulled beef" },
    ],
  },
  {
    key: "sandwiches",
    icon: "sandwich",
    title: { ru: "Сэндвичи", uz: "Sendvichlar", en: "Sandwiches" },
    items: [
      { ru: "Клаб", uz: "Klab", en: "Club" },
      { ru: "По-домашнему", uz: "Uy uslubida", en: "Home-style" },
      { ru: "С рваной говядиной", uz: "Yirtilgan mol go'shti bilan", en: "Pulled beef" },
    ],
  },
  {
    key: "hotdogs",
    icon: "hotdog",
    title: { ru: "Хот-доги", uz: "Xot-doglar", en: "Hot dogs" },
    items: [
      { ru: "Сальса", uz: "Salsa", en: "Salsa" },
      { ru: "Цезарь", uz: "Sezar", en: "Caesar" },
      { ru: "Пикантный", uz: "Achchiq", en: "Spicy" },
    ],
  },
  {
    key: "snacks",
    icon: "snack",
    title: { ru: "Горячие закуски", uz: "Issiq gazaklar", en: "Hot snacks" },
    items: [
      { ru: "Наггетсы", uz: "Naggetslar", en: "Nuggets" },
      { ru: "Стрипсы", uz: "Stripslar", en: "Strips" },
      { ru: "Сырные подушечки", uz: "Pishloqli yostiqchalar", en: "Cheese bites" },
      { ru: "Луковые кольца", uz: "Piyoz halqalari", en: "Onion rings" },
    ],
  },
  {
    key: "sides",
    icon: "side",
    title: { ru: "Гарниры", uz: "Garnirlar", en: "Sides" },
    items: [
      { ru: "Картофель Айдахо", uz: "Aydaxo kartoshkasi", en: "Idaho potatoes" },
      { ru: "Картофель фри", uz: "Fri kartoshka", en: "French fries" },
      { ru: "Рис с овощами", uz: "Sabzavotli guruch", en: "Rice with vegetables" },
      { ru: "Овощи гриль", uz: "Grilda sabzavotlar", en: "Grilled vegetables" },
    ],
  },
  {
    key: "salads",
    icon: "salad",
    title: { ru: "Салаты", uz: "Salatlar", en: "Salads" },
    items: [
      { ru: "Коул слоу", uz: "Koul slou", en: "Coleslaw" },
      { ru: "Микс салат", uz: "Miks salat", en: "Mixed salad" },
    ],
  },
];

export const menuCopy = {
  eyebrow: { ru: "Летний ресторан", uz: "Yozgi restoran", en: "Summer restaurant" },
  title: { ru: "Меню кухни", uz: "Oshxona menyusi", en: "Kitchen menu" },
  lead: {
    ru: "Готовим на территории каждый день. Часть позиций — по предзаказу; актуальные цены подскажет официант или администратор.",
    uz: "Har kuni hududda tayyorlaymiz. Ayrim taomlar — oldindan buyurtma asosida; joriy narxlarni ofitsiant yoki administrator aytadi.",
    en: "Cooked on site every day. Some dishes are by pre-order; the waiter or the administrator will tell you today's prices.",
  },
  priceNote: {
    ru: "Цены не публикуем на сайте, чтобы они всегда были актуальными — уточните их на месте или по телефону.",
    uz: "Narxlar doim dolzarb bo'lishi uchun saytda e'lon qilinmaydi — joyida yoki telefon orqali aniqlashtiring.",
    en: "Prices are not published here so they are never out of date — please ask on site or by phone.",
  },
} satisfies Record<string, LocalizedString>;
