import type { LocalizedString } from "./types";

/**
 * Топчаны и пикник-зона не работают — один выключатель на весь сайт.
 *
 * Распоряжение оператора 12.10.2026: «отключить бассейн и топчан из поля
 * видимости», и на визитке для Instagram тоже. Устроено как pool-closure.ts:
 * флаг в коде, а его читают страница топчана, форма и серверное действие,
 * кнопка на первом экране, карточка на главной, меню и подвал, шапка, карта
 * сайта и брифинги ИИ. Услуги «Пикник-зона» и «Мангал и казан» скрыты в панели
 * («Услуги» → «Скрыть»): мангал и казан берут только вместе с топчаном.
 *
 * Чтобы открыть топчаны обратно — поставить closed: false и в панели снять
 * «Скрыть» у «Пикник-зоны» и «Мангала и казана». Карточку на визитке
 * (chimgan-link) вернуть из её истории git.
 */
export const topchanClosure = {
  closed: true,
  since: "12.10.2026",

  /** Срок открытия не назван намеренно: обещанная дата, которую сдвинут, хуже её отсутствия. */
  title: {
    ru: "Топчаны закрыты до нового сезона",
    uz: "Topchanlar yangi mavsumgacha yopiq",
    en: "The topchans are closed until the new season",
  } satisfies LocalizedString,

  text: {
    ru: "Пикник-зона с топчанами работает в тёплый сезон. Сейчас заявки на топчан не принимаются. Об открытии сообщим на сайте и в Instagram.",
    uz: "Topchanli piknik zonasi issiq mavsumda ishlaydi. Hozircha topchanga arizalar qabul qilinmaydi. Ochilishi haqida saytda va Instagram'da xabar beramiz.",
    en: "The picnic area with topchans is open in the warm season. We are not accepting topchan requests at the moment. We will announce the reopening on the site and on Instagram.",
  } satisfies LocalizedString,

  formError: {
    ru: "Топчаны закрыты до нового сезона — заявки не принимаются.",
    uz: "Topchanlar yangi mavsumgacha yopiq — arizalar qabul qilinmaydi.",
    en: "The topchans are closed until the new season — requests are not accepted.",
  } satisfies LocalizedString,
} as const;

/** Кадры с топчанами — из фотоархивов, пока топчаны закрыты, не показываются. */
export const topchanPhotos: readonly string[] = ["galTopchanPeaks", "galTopchanRidge", "galTopchanRow", "galTopchanSwing", "galTopchanInside"];

/** Что работает, пока закрыты бассейн и топчаны, — гость пришёл отдыхать, а не читать отказ. */
export const openInstead: LocalizedString = {
  ru: "Тюбинг-горка и ресторан работают как обычно.",
  uz: "Tyubing gorkasi va restoran odatdagidek ishlaydi.",
  en: "The tubing hill and the restaurant are open as usual.",
};
