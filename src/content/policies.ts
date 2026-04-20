import type { LocalizedList, LocalizedString } from "./types";

export type PolicyPage = {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
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
      ru: "Ориентиры и контакты для планирования поездки в CHIMGANSOY.",
      uz: "CHIMGANSOYga safarni rejalash uchun mo'ljallar va kontaktlar.",
      en: "Directions and contacts for planning a trip to CHIMGANSOY.",
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
    slug: "payment-refund",
    title: { ru: "Оплата и возврат", uz: "To'lov va qaytarish", en: "Payment and refund" },
    description: {
      ru: "Условия оплаты, предоплаты и возврата будут финализированы перед запуском.",
      uz: "To'lov, oldindan to'lov va qaytarish shartlari ishga tushirishdan oldin yakunlanadi.",
      en: "Payment, prepayment, and refund terms will be finalized before launch.",
    },
    sections: [
      {
        title: { ru: "Условия", uz: "Shartlar", en: "Terms" },
        items: {
          ru: ["Предоплата может потребоваться для подтверждения бронирования.", "Возврат зависит от даты отмены и выбранного тарифа.", "Финальные условия должны быть согласованы с юридической командой."],
          uz: ["Bronni tasdiqlash uchun oldindan to'lov talab qilinishi mumkin.", "Qaytarish bekor qilish sanasi va tanlangan tarifga bog'liq.", "Yakuniy shartlar yuridik jamoa bilan kelishilishi kerak."],
          en: ["Prepayment may be required to confirm a booking.", "Refunds depend on cancellation date and selected rate.", "Final terms should be approved by the legal team."],
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
    slug: "public-offer",
    title: { ru: "Публичная оферта", uz: "Ommaviy oferta", en: "Public offer agreement" },
    description: {
      ru: "Шаблон страницы для размещения официальной публичной оферты.",
      uz: "Rasmiy ommaviy ofertani joylashtirish uchun sahifa shabloni.",
      en: "Page template for the official public offer agreement.",
    },
    sections: [
      {
        title: { ru: "Статус документа", uz: "Hujjat holati", en: "Document status" },
        items: {
          ru: ["Юридический текст должен быть добавлен перед публикацией.", "Версия и дата вступления в силу указываются после утверждения."],
          uz: ["Yuridik matn e'lon qilishdan oldin qo'shilishi kerak.", "Versiya va kuchga kirish sanasi tasdiqdan keyin ko'rsatiladi."],
          en: ["Legal text should be added before publication.", "Version and effective date are added after approval."],
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
  {
    slug: "privacy-policy",
    title: { ru: "Политика конфиденциальности", uz: "Maxfiylik siyosati", en: "Privacy policy" },
    description: {
      ru: "Как сайт собирает и обрабатывает персональные данные.",
      uz: "Sayt shaxsiy ma'lumotlarni qanday yig'ishi va qayta ishlashi haqida.",
      en: "How the website collects and processes personal data.",
    },
    sections: [
      {
        title: { ru: "Данные", uz: "Ma'lumotlar", en: "Data" },
        items: {
          ru: ["Формы могут собирать имя, телефон, email и детали запроса.", "Данные используются для связи с гостем и обработки заявки.", "Финальный текст должен быть согласован с юристом."],
          uz: ["Formalar ism, telefon, email va so'rov tafsilotlarini yig'ishi mumkin.", "Ma'lumotlar mehmon bilan aloqa va so'rovni qayta ishlash uchun ishlatiladi.", "Yakuniy matn yurist bilan kelishilishi kerak."],
          en: ["Forms may collect name, phone, email, and request details.", "Data is used to contact guests and process requests.", "Final text should be approved by legal counsel."],
        },
      },
    ],
  },
];
