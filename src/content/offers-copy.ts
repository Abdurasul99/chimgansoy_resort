import type { Locale } from "@/i18n/config";

/**
 * Подписи карточек акций — общие для блока акций на главной
 * (components/sections/OffersSection.tsx) и зимнего экрана
 * (components/new-year/WinterOffers.tsx). Сами акции — content/promotions.ts.
 */

export const TERMS_LABEL: Record<Locale, string> = { ru: "Условия акции", uz: "Aksiya shartlari", en: "Offer terms" };

/** Подпись под полоской дней у акции «День рождения» — пересказ условия владельца. */
export const BDAY_WINDOW: Record<Locale, string> = {
  ru: "3 дня до · ваш день · 3 дня после",
  uz: "3 kun oldin · sizning kuningiz · 3 kun keyin",
  en: "3 days before · your day · 3 days after",
};

/**
 * Две кнопки, как на странице домика: «в один клик» — короткая форма заявки,
 * дальше с гостем говорит администратор; «онлайн» — движок Exely на /bron, для
 * тех, кто оформляет сам. До 23.11.2026 у акций была одна «Забронировать» в
 * движок — гость с акции не видел самого короткого пути (владелец).
 */
export const ONE_CLICK: Record<Locale, string> = {
  ru: "Забронировать в один клик",
  uz: "Bir bosishda bron qilish",
  en: "Book in one click",
};
export const ENGINE_LABEL: Record<Locale, string> = { ru: "Онлайн-бронирование", uz: "Onlayn bron qilish", en: "Book online" };

/** Таблица «2+1»: три ночи без акции, по акции и за ночь. */
export const TWO_PLUS_ONE_COLS = {
  ru: { how: "Как считается", one: "3 ночи без акции", three: "3 ночи по акции", per: "За ночь", note: "Суммы в сумах, ночи с воскресенья по четверг. Завтрак включён, обед и ужин — по меню ресторана, отдельно." },
  uz: { how: "Qanday hisoblanadi", one: "3 kecha aksiyasiz", three: "3 kecha aksiya bo'yicha", per: "Bir kecha uchun", note: "Narxlar so'mda, yakshanbadan payshanbagacha bo'lgan kechalar. Nonushta narxga kiradi, tushlik va kechki ovqat — restoran menyusi bo'yicha, alohida." },
  en: { how: "How it adds up", one: "3 nights, no offer", three: "3 nights, offer", per: "Per night", note: "UZS, Sunday–Thursday nights. Breakfast included; lunch and dinner are from the restaurant menu, extra." },
} as const;

/** Подписи расчёта скидки («−20% на Chalet»): формулировки оператора. */
export const DISCOUNT_COPY = {
  ru: {
    how: "Как считается",
    night: "/ ночь",
    discount: "Скидка",
    saving: "Экономия",
    savingPer: "сум за каждую ночь",
    breakfast: "Завтрак включён в стоимость проживания.",
    four: "Если вас четверо",
    lead: (n: number) => `При размещении ${n} гостей:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = ${pp} сум с человека за ночь`,
    total: (pp: string) => `Всего ${pp} сум / человек / ночь`,
    totalNote: (n: number) => `при размещении ${n} гостей в Chalet.`,
  },
  uz: {
    how: "Qanday hisoblanadi",
    night: "/ kecha",
    discount: "Chegirma",
    saving: "Tejaysiz",
    savingPer: "so'm har bir kecha uchun",
    breakfast: "Nonushta yashash narxiga kiritilgan.",
    four: "To'rt kishi bo'lsangiz",
    lead: (n: number) => `${n} mehmon joylashganda:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = kishi boshiga kechasiga ${pp} so'm`,
    total: (pp: string) => `Atigi ${pp} so'm / kishi / kecha`,
    totalNote: (n: number) => `Shaleda ${n} mehmon bo'lganda.`,
  },
  en: {
    how: "How it adds up",
    night: "/ night",
    discount: "Discount",
    saving: "You save",
    savingPer: "UZS every night",
    breakfast: "Breakfast is included in the rate.",
    four: "If there are four of you",
    lead: (n: number) => `With ${n} guests:`,
    line: (price: string, n: number, pp: string) => `${price} ÷ ${n} = ${pp} UZS per person per night`,
    total: (pp: string) => `Just ${pp} UZS / person / night`,
    totalNote: (n: number) => `with ${n} guests in the Chalet.`,
  },
} as const;

/** Бейдж без цифры, которая уже крупно на стикере: «−20% · Ноябрь» → «Ноябрь». */
export function badgeWithoutSticker(badge: string, stickerLabel?: string) {
  return stickerLabel && badge.startsWith(stickerLabel) ? badge.slice(stickerLabel.length).replace(/^\s*·\s*/, "") : badge;
}
