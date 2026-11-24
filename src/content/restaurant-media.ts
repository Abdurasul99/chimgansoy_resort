import type { Locale } from "@/i18n/config";
import type { LocalizedString } from "./types";

/**
 * Фото и контакты страницы ресторана «Сазанчик».
 *
 * Снимки — кадры из роликов Instagram ресторана @sazanchik.chimgandarbaza
 * (13–20.11.2026): настоящий зал, вывеска, бар, завтраки и блюда. Посты с
 * надписями поверх фото не брали — только чистые кадры видео. Логотип —
 * последний кадр ролика, на чёрном, переведён в прозрачный фон (рисуется только
 * на тёмном: тёмный контур букв ушёл вместе с фоном).
 *
 * Номера — из меню ресторана (Sazanchik_Chimgan_A3_Print.pdf, 24.11.2026):
 * «Внутренний номер 1206», «Доставка: +998 50 154 00 44», «Обслуживание 20%».
 */

export const SAZANCHIK_LOGO = "/images/restaurant/sazanchik-logo.webp";
export const SAZANCHIK_INSTAGRAM = "https://www.instagram.com/sazanchik.chimgandarbaza/";
export const SAZANCHIK_INSTAGRAM_HANDLE = "@sazanchik.chimgandarbaza";
/** Доставка и еда с собой — номер из меню. */
export const SAZANCHIK_DELIVERY_PHONE = "+998 50 154 00 44";
/** Внутренний номер ресторана — звонят из домика. */
export const SAZANCHIK_EXTENSION = "1206";
export const SAZANCHIK_SERVICE_PERCENT = 20;

export type StoryFrame = { src: string; alt: LocalizedString };
export type StoryGroup = { id: string; title: LocalizedString; cover: string; frames: StoryFrame[] };

const f = (name: string, ru: string, uz: string, en: string): StoryFrame => ({
  src: `/images/restaurant/story/${name}.jpg`,
  alt: { ru, uz, en },
});

/** «Актуальное» как в Instagram ресторана: кружки под первым экраном. */
export const STORY_GROUPS: StoryGroup[] = [
  {
    id: "hall",
    title: { ru: "Зал", uz: "Zal", en: "The hall" },
    cover: "/images/restaurant/ring/hall.jpg",
    frames: [
      f("hall-mountain-windows", "Зал вечером: лампы над столами и горы в окнах", "Kechki zal: stollar ustida chiroqlar, derazalarda tog'lar", "The hall in the evening: lamps over the tables, mountains in the windows"),
      f("hall-stone-wall", "Каменная стена, лампы и столы", "Tosh devor, chiroqlar va stollar", "Stone wall, lamps and tables"),
      f("bar", "Бар: бирюзовая стойка и полки с напитками", "Bar: feruza peshtaxta va ichimliklar javonlari", "The bar: turquoise counter and shelves of drinks"),
      f("terrace", "Терраса с видом на долину", "Vodiyga qaragan ayvon", "The terrace overlooking the valley"),
    ],
  },
  {
    id: "kitchen",
    title: { ru: "Кухня", uz: "Oshxona", en: "Kitchen" },
    cover: "/images/restaurant/ring/kitchen.jpg",
    frames: [
      f("shivit-oshi", "Шивит оши — зелёная лапша с мясом и овощами", "Shivit oshi — go'sht va sabzavotli yashil lag'mon", "Shivit oshi — green dill noodles with meat and vegetables"),
      f("shivit-oshi-sauce", "Соус для шивит оши", "Shivit oshi uchun sous", "The sauce for shivit oshi"),
      f("lagman", "Лагман: соус поливают прямо на лапшу", "Lag'mon: sous to'g'ridan-to'g'ri ugra ustiga quyiladi", "Lagman: the sauce poured over the noodles"),
      f("lagman-wok", "Овощи для лагмана в воке", "Lag'mon uchun sabzavotlar vokda", "Vegetables for the lagman in the wok"),
      f("greek-salad", "Греческий салат", "Grekcha salat", "Greek salad"),
      f("lula-kebab", "Люля-кебаб на лаваше", "Lavash ustida lyulya-kabob", "Lula kebab on lavash"),
    ],
  },
  {
    id: "breakfast",
    title: { ru: "Завтраки", uz: "Nonushta", en: "Breakfast" },
    cover: "/images/restaurant/ring/breakfast.jpg",
    frames: [
      f("breakfast-hot", "Завтрак: выпечка, пицца, яйца и горячее", "Nonushta: pishiriqlar, pitsa, tuxum va issiq taomlar", "Breakfast: pastries, pizza, eggs and hot dishes"),
      f("breakfast-drinks", "Соки, мёд и вода с лимоном", "Sharbatlar, asal va limonli suv", "Juices, honey and lemon water"),
      f("breakfast-juices", "Диспенсеры с соком и мюсли", "Sharbat va myusli dispenserlari", "Juice and cereal dispensers"),
    ],
  },
  {
    id: "takeaway",
    title: { ru: "С собой", uz: "Olib ketish", en: "Takeaway" },
    cover: "/images/restaurant/ring/takeaway.jpg",
    frames: [
      f("takeaway-sign", "Окно выдачи Take away", "Take away berish oynasi", "The take-away window"),
      f("takeaway-window", "Окно выдачи и меню с собой", "Berish oynasi va olib ketish menyusi", "The pickup window and its menu"),
      f("coffee-to-go", "Кофе с собой: эспрессо, американо, капучино", "Olib ketish uchun qahva: espresso, amerikano, kapuchino", "Coffee to go: espresso, americano, cappuccino"),
    ],
  },
  {
    id: "outside",
    title: { ru: "Снаружи", uz: "Tashqarida", en: "Outside" },
    cover: "/images/restaurant/ring/outside.jpg",
    frames: [
      f("facade", "Вход в ресторан «Сазанчик»", "«Sazanchik» restoraniga kirish", "The entrance to Sazanchik"),
      f("sign-sky", "Вывеска «Сазанчик» на фоне неба", "Osmon fonida «Sazanchik» peshlavhasi", "The Sazanchik sign against the sky"),
      f("sign-evening", "Вывеска вечером", "Kechki peshlavha", "The sign in the evening"),
    ],
  },
];

/** Веер карточек на первом экране (компьютер): какую группу открывает каждая. */
export const HERO_FAN: { frame: StoryFrame; group: string }[] = [
  { frame: STORY_GROUPS[1].frames[0], group: "kitchen" },
  { frame: STORY_GROUPS[0].frames[0], group: "hall" },
  { frame: STORY_GROUPS[1].frames[2], group: "kitchen" },
];

/** Фон первого экрана на телефоне — зал с окнами на горы. */
export const HERO_BACKDROP = STORY_GROUPS[0].frames[0];

/** Два кадра у блока «С собой»: окно выдачи и кофе с собой. */
export const TAKEAWAY_FRAMES: StoryFrame[] = [STORY_GROUPS[3].frames[0], STORY_GROUPS[3].frames[2]];

export function storyAlt(frame: StoryFrame, locale: Locale): string {
  return frame.alt[locale] || frame.alt.ru;
}
