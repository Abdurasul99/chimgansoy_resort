import type { LocalizedList, LocalizedString } from "./types";
import { legalPolicies } from "./policies-legal";

export type PolicyPage = {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  /** true = final legal text (from the operator's documents) → allow indexing.
      Omitted/false on the remaining placeholder pages keeps them noindex. */
  indexable?: boolean;
  sections: {
    title: LocalizedString;
    items: LocalizedList;
  }[];
};

export const policies: PolicyPage[] = [
  {
    slug: "how-to-get-there",
    title: { ru: "Как добраться", uz: "Qanday borish", en: "How to get there" },
    description: {
      ru: "Ориентиры и контакты для планирования поездки в CHIMGAN DARBAZA.",
      uz: "CHIMGAN DARBAZAga safarni rejalash uchun mo'ljallar va kontaktlar.",
      en: "Directions and contacts for planning a trip to CHIMGAN DARBAZA.",
    },
    sections: [
      {
        title: { ru: "Перед поездкой", uz: "Safar oldidan", en: "Before the trip" },
        items: {
          ru: ["Уточните актуальную дорогу и погодные условия у администратора.", "Сохраните номер телефона и геолокацию перед выездом.", "В высокий сезон рекомендуем выезжать заранее."],
          uz: ["Administrator orqali yo'l va ob-havo holatini aniqlashtiring.", "Yo'lga chiqishdan oldin telefon raqami va geolokatsiyani saqlang.", "Yuqori mavsumda ertaroq chiqishni tavsiya qilamiz."],
          en: ["Confirm current road and weather conditions with the administrator.", "Save the phone number and location before leaving.", "In high season, plan extra travel time."],
        },
      },
    ],
  },
  {
    slug: "accommodation-rules",
    title: { ru: "Правила проживания", uz: "Yashash qoidalari", en: "Accommodation rules" },
    description: {
      ru: "Базовые правила для комфортного и безопасного проживания.",
      uz: "Qulay va xavfsiz yashash uchun asosiy qoidalar.",
      en: "Basic rules for a comfortable and safe stay.",
    },
    sections: [
      {
        title: { ru: "Проживание", uz: "Yashash", en: "Stay" },
        items: {
          ru: ["Заезд и выезд подтверждаются при бронировании.", "Соблюдайте тишину в ночное время.", "Берегите имущество и природную территорию курорта."],
          uz: ["Kirish va chiqish vaqti bron paytida tasdiqlanadi.", "Tungi vaqtda tinchlikka rioya qiling.", "Kurort mulki va tabiat hududini asrang."],
          en: ["Check-in and check-out are confirmed during booking.", "Respect quiet hours at night.", "Please take care of resort property and the natural territory."],
        },
      },
    ],
  },
  {
    slug: "resort-visiting-rules",
    title: { ru: "Правила посещения курорта", uz: "Kurortga tashrif qoidalari", en: "Resort visiting rules" },
    description: {
      ru: "Правила для дневных гостей и посетителей территории.",
      uz: "Kunlik mehmonlar va hududga tashrif buyuruvchilar uchun qoidalar.",
      en: "Rules for day visitors and resort territory guests.",
    },
    sections: [
      {
        title: { ru: "На территории", uz: "Hududda", en: "On the territory" },
        items: {
          ru: ["Вход в отдельные зоны может требовать предварительного бронирования.", "Соблюдайте чистоту и инструкции персонала.", "Дети должны находиться под присмотром взрослых."],
          uz: ["Ayrim hududlarga kirish oldindan bron talab qilishi mumkin.", "Tozalik va xodimlar ko'rsatmalariga rioya qiling.", "Bolalar kattalar nazoratida bo'lishi kerak."],
          en: ["Some areas may require advance booking.", "Keep the territory clean and follow staff instructions.", "Children must be supervised by adults."],
        },
      },
    ],
  },
  {
    slug: "user-agreement",
    title: { ru: "Пользовательское соглашение", uz: "Foydalanuvchi kelishuvi", en: "User agreement" },
    description: {
      ru: "Условия использования сайта и цифровых сервисов.",
      uz: "Sayt va raqamli xizmatlardan foydalanish shartlari.",
      en: "Terms for using the website and digital services.",
    },
    sections: [
      {
        title: { ru: "Использование сайта", uz: "Saytdan foydalanish", en: "Website use" },
        items: {
          ru: ["Пользователь должен предоставлять корректные контактные данные.", "Контент сайта не является финальным договором без подтверждения бронирования."],
          uz: ["Foydalanuvchi to'g'ri kontakt ma'lumotlarini taqdim etishi kerak.", "Sayt kontenti bron tasdiqlanmaguncha yakuniy shartnoma hisoblanmaydi."],
          en: ["Users should provide accurate contact details.", "Website content is not a final agreement until a booking is confirmed."],
        },
      },
    ],
  },
  // Real legal documents (Public Offer, Privacy Policy, Return & Cancellation)
  // provided by the operator — see policies-legal.ts.
  ...legalPolicies,
];
