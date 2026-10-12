import type { Locale } from "@/i18n/config";

/**
 * Тексты раздела ресторана — все три языка в одном месте.
 *
 * Типизированный Record<Locale, …>: забытый перевод не соберётся. Название,
 * описания блюд, часы и строка-объявление — не здесь, их ресторан меняет в
 * админке; здесь только интерфейс.
 *
 * С 12.10.2026 раздел — меню и фотогалерея: ни одна строка не зовёт заказать
 * или забронировать на сайте. Вопросы — по телефону.
 */

export type RestaurantCopy = {
  navLabel: string;
  eyebrow: string;
  /** Карточка-ссылка на ресторан на других страницах сайта. */
  teaser: { title: string; text: string };
  hours: string;
  hoursUnknown: string;
  openNow: string;
  closedNow: string;
  phone: string;
  hiddenPreview: string;
  previewExit: string;
  aboutTitle: string;
  call: string;
  sections: string;
  menu: {
    title: string;
    search: string;
    empty: string;
    nothingFound: string;
    unavailable: string;
    preorder: string;
    preorderHint: string;
    close: string;
  };
  gallery: {
    title: string;
    open: (n: number) => string;
  };
};

export const restaurantCopy: Record<Locale, RestaurantCopy> = {
  ru: {
    navLabel: "Ресторан",
    eyebrow: "Ресторан в горах · 1700 м",
    teaser: { title: "Меню и фото", text: "Блюда, порции и цены — и как выглядит ресторан" },
    hours: "Часы работы",
    hoursUnknown: "Часы работы уточняйте по телефону",
    openNow: "Открыто сейчас",
    closedNow: "Сейчас закрыто",
    phone: "Телефон ресторана",
    hiddenPreview: "Предпросмотр: раздел скрыт от гостей.",
    previewExit: "Выйти из предпросмотра",
    aboutTitle: "О ресторане",
    call: "Позвонить",
    sections: "Разделы меню",
    menu: {
      title: "Меню",
      search: "Найти блюдо",
      empty: "Меню скоро появится — кухня уже готовит список блюд.",
      nothingFound: "Ничего не нашлось — попробуйте другое слово.",
      unavailable: "Временно нет",
      preorder: "Под заказ",
      preorderHint: "Готовим по предварительному заказу — позвоните заранее.",
      close: "Закрыть",
    },
    gallery: {
      title: "Фото",
      open: (n) => `Открыть фото ${n}`,
    },
  },
  uz: {
    navLabel: "Restoran",
    eyebrow: "Tog'dagi restoran · 1700 m",
    teaser: { title: "Menyu va suratlar", text: "Taomlar, porsiyalar va narxlar — restoran qanday ko'rinishi ham" },
    hours: "Ish vaqti",
    hoursUnknown: "Ish vaqtini telefon orqali aniqlang",
    openNow: "Hozir ochiq",
    closedNow: "Hozir yopiq",
    phone: "Restoran telefoni",
    hiddenPreview: "Oldindan ko'rish: bo'lim mehmonlardan yashirin.",
    previewExit: "Oldindan ko'rishdan chiqish",
    aboutTitle: "Restoran haqida",
    call: "Qo'ng'iroq",
    sections: "Menyu bo'limlari",
    menu: {
      title: "Menyu",
      search: "Taom qidirish",
      empty: "Menyu tez orada paydo bo'ladi — oshxona taomlar ro'yxatini tayyorlamoqda.",
      nothingFound: "Hech narsa topilmadi — boshqa so'z bilan qidiring.",
      unavailable: "Vaqtincha yo'q",
      preorder: "Buyurtma asosida",
      preorderHint: "Oldindan buyurtma asosida tayyorlaymiz — oldindan qo'ng'iroq qiling.",
      close: "Yopish",
    },
    gallery: {
      title: "Suratlar",
      open: (n) => `${n}-suratni ochish`,
    },
  },
  en: {
    navLabel: "Restaurant",
    eyebrow: "A restaurant in the mountains · 1700 m",
    teaser: { title: "Menu and photos", text: "Dishes, portions and prices — and what the restaurant looks like" },
    hours: "Opening hours",
    hoursUnknown: "Please check the hours by phone",
    openNow: "Open now",
    closedNow: "Closed now",
    phone: "Restaurant phone",
    hiddenPreview: "Preview: this section is hidden from guests.",
    previewExit: "Leave preview",
    aboutTitle: "About the restaurant",
    call: "Call",
    sections: "Menu sections",
    menu: {
      title: "Menu",
      search: "Find a dish",
      empty: "The menu is coming soon — the kitchen is putting the list together.",
      nothingFound: "Nothing found — try another word.",
      unavailable: "Not available today",
      preorder: "Made to order",
      preorderHint: "Cooked to order — please call ahead.",
      close: "Close",
    },
    gallery: {
      title: "Photos",
      open: (n) => `Open photo ${n}`,
    },
  },
};

export function restaurantText(locale: Locale): RestaurantCopy {
  return restaurantCopy[locale];
}
