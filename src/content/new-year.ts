import type { Locale } from "@/i18n/config";
import type { LocalizedString, PageSeo } from "@/content/types";

/**
 * Новогодний экран /novyi-god и кнопка «Новый год» в шапке.
 *
 * Владелец, 27.11.2026: отдельный интерактивный экран со своей ссылкой, вход —
 * кнопкой в шапке; остальной сайт не переодевается. Зимнюю тему целиком
 * (переключатель сезона, снег по всем страницам, Дед Мороз, ёлка) сняли
 * 09.09.2026 по его же просьбе — возвращать её этим экраном нельзя. С 1
 * декабря экран — главная по умолчанию (winterDefaultOn ниже); страницы
 * сайта при этом прежние.
 *
 * Цен и праздничных пакетов здесь нет намеренно: праздничные ночи считает
 * Exely, а коммерческие цифры подтверждает Роман. Экран ведёт в каталог и на
 * страницы домиков, где форма сама проверяет свободные даты.
 */

export const NEW_YEAR_PATH = "/novyi-god";

/**
 * Экран смонтирован. Занавес перехода из шапки поднимается только по этому
 * сигналу: по одной смене адреса он мог открыть светлый скелет загрузки
 * (`[locale]/loading.tsx`), а не ночное небо.
 */
export const NEW_YEAR_READY_EVENT = "new-year:ready";

/** Наступила полночь, пока гость был на экране: салют в небе над горами. */
export const NEW_YEAR_MIDNIGHT_EVENT = "new-year:midnight";

/** Полночь 1 января 2027 по Ташкенту (UTC+5 круглый год) = 19:00 UTC 31 декабря. */
export const NEW_YEAR_MIDNIGHT = Date.UTC(2026, 11, 31, 19, 0, 0);

/** Последний день (по Ташкенту, включительно), когда кнопка видна в шапке. */
export const NEW_YEAR_BUTTON_UNTIL = "2027-01-10";

/** Дата по Ташкенту, YYYY-MM-DD. */
export function tashkentDay(now = Date.now()): string {
  return new Date(now + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Показывать ли кнопку «Новый год» в шапке и страницу в карте сайта. */
export function newYearButtonOn(now = Date.now()): boolean {
  return tashkentDay(now) <= NEW_YEAR_BUTTON_UNTIL;
}

/**
 * Зима — по умолчанию (владелец, 27.11.2026: «зимняя тема должна
 * автоматически примениться 1 декабря… чтобы ни я, ни пользователи не
 * переводили; по дефолту всегда зимняя тема»).
 *
 * С первого по последний день (по Ташкенту, включительно) главная ведёт на
 * зимний экран — переадресацией в src/proxy.ts, ещё до рендера. Кнопка
 * «Обычный сайт» на экране ставит cookie REGULAR_SITE_COOKIE=regular на время
 * сессии браузера: дальше гость ходит по обычному сайту, а в следующий визит
 * снова встречает зима. Кнопка «Зима» cookie снимает. Конец — вместе с
 * кнопкой в шапке: экран новогодний (отсчёт, «2027»), после праздников он
 * не главная. Продлить — поменять дату здесь.
 *
 * Поисковые роботы и превью ссылок переадресацию не получают: в выдаче и в
 * мессенджерах остаётся обычная главная.
 */
export const WINTER_DEFAULT_FROM = "2026-12-01";
export const WINTER_DEFAULT_UNTIL = NEW_YEAR_BUTTON_UNTIL;
export const REGULAR_SITE_COOKIE = "cd-theme";

export function winterDefaultOn(now = Date.now()): boolean {
  const day = tashkentDay(now);
  return day >= WINTER_DEFAULT_FROM && day <= WINTER_DEFAULT_UNTIL;
}

export type CountdownUnit = "d" | "h" | "m" | "s";
export type CountdownParts = Record<CountdownUnit, number>;

/** Сколько осталось до полуночи; null — Новый год уже наступил. */
export function countdownParts(now = Date.now(), target = NEW_YEAR_MIDNIGHT): CountdownParts | null {
  const left = target - now;
  if (left <= 0) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

const UNIT_FORMS: Record<Locale, Record<CountdownUnit, string[]>> = {
  ru: {
    d: ["день", "дня", "дней"],
    h: ["час", "часа", "часов"],
    m: ["минута", "минуты", "минут"],
    s: ["секунда", "секунды", "секунд"],
  },
  // В узбекском существительное после числа не меняется.
  uz: { d: ["kun"], h: ["soat"], m: ["daqiqa"], s: ["soniya"] },
  en: { d: ["day", "days"], h: ["hour", "hours"], m: ["minute", "minutes"], s: ["second", "seconds"] },
};

/** «3 дня», «21 день», «11 дней»; «1 day» / «2 days»; «5 kun». */
export function unitLabel(locale: Locale, unit: CountdownUnit, n: number): string {
  const forms = UNIT_FORMS[locale][unit];
  if (forms.length === 1) return forms[0];
  if (forms.length === 2) return n === 1 ? forms[0] : forms[1];
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

const L = (ru: string, uz: string, en: string): LocalizedString => ({ ru, uz, en });

export const newYearCopy = {
  /** Кнопка в шапке. 27.11.2026 владелец: «Новый год замени на зиму». */
  button: L("Зима", "Qish", "Winter"),
  buttonAria: L(
    "Зима в горах Чимгана — праздничный экран",
    "Chimyon tog'larida qish — bayram sahifasi",
    "Winter in the Chimgan mountains — holiday page",
  ),
  /** Строка в мобильном меню. */
  drawer: L("Зима в горах", "Tog'larda qish", "Winter in the mountains"),
  drawerHint: L("Снежный шар, отсчёт и салют", "Qorli shar, sanoq va mushakbozlik", "Snow globe, countdown and fireworks"),
  /** Та же кнопка на самом новогоднем экране — обратно на обычный сайт. */
  back: L("Обычный сайт", "Oddiy sayt", "Regular site"),
  backAria: L("Вернуться на обычный сайт", "Oddiy saytga qaytish", "Back to the regular site"),
  backDrawer: L("Вернуться на обычный сайт", "Oddiy saytga qaytish", "Back to the regular site"),
  backDrawerHint: L("Туда, откуда пришли на праздник", "Bayramga qayerdan kelgan bo'lsangiz, o'sha yerga", "Where you came from"),

  title: L("Новый год в горах Чимгана", "Chimyon tog'larida Yangi yil", "New Year in the Chimgan mountains"),
  lead: L(
    "Домик в горах, огни на склоне и тишина после полуночи. Встречайте 2027-й в CHIMGAN DARBAZA.",
    "Tog'dagi uycha, qiyalikdagi chiroqlar va yarim tundan keyingi sokinlik. 2027-yilni CHIMGAN DARBAZA'da kutib oling.",
    "A cabin in the mountains, lights on the slope and the quiet after midnight. See in 2027 at CHIMGAN DARBAZA.",
  ),
  until: L("До Нового года", "Yangi yilgacha", "Until the New Year"),
  happy: L("С Новым 2027 годом!", "Yangi 2027-yil muborak!", "Happy New Year 2027!"),
  book: L("Забронировать на праздники", "Bayramga bron qilish", "Book for the holidays"),
  call: L("Позвонить", "Qo'ng'iroq qilish", "Call"),

  shake: L("Встряхнуть шар", "Sharni silkitish", "Shake the globe"),
  hintDesk: L("Потяните шар мышкой — пойдёт снег", "Sharni sichqoncha bilan torting — qor yog'adi", "Drag the globe with your mouse to make it snow"),
  hintTouch: L(
    "Проведите по шару пальцем или встряхните телефон",
    "Shar ustidan barmoq yurgizing yoki telefonni silkiting",
    "Swipe across the globe or shake your phone",
  ),
  globeAlt: L(
    "Снежный шар: CHIMGAN DARBAZA вечером, огни в долине",
    "Qorli shar: kechki CHIMGAN DARBAZA, vodiydagi chiroqlar",
    "Snow globe: CHIMGAN DARBAZA in the evening, lights in the valley",
  ),
  lights: L("Сменить огни гирлянды", "Gulchambar chiroqlarini almashtirish", "Change the garland lights"),

  staysTitle: L("Где встретить праздник", "Bayramni qayerda kutib olasiz", "Where to see in the New Year"),
  staysLead: L(
    "Выберите домик и даты в форме на его странице — она сразу покажет, свободен ли он.",
    "Uychani tanlang va uning sahifasidagi shaklda sanalarni belgilang — shakl bo'sh-bandligini darhol ko'rsatadi.",
    "Pick a cabin and your dates in the form on its page — it shows straight away whether the cabin is free.",
  ),
  more: L("Подробнее", "Batafsil", "Details"),
  stays: {
    chalet: {
      name: L("Шале", "Shale", "Chalet"),
      text: L(
        "Большой дом для семьи или компании: спальни, кухня и терраса с видом на горы.",
        "Oila yoki do'stlar uchun katta uy: yotoqxonalar, oshxona va tog'larga qaragan terrasa.",
        "A big house for a family or friends: bedrooms, a kitchen and a terrace facing the mountains.",
      ),
    },
    glamping: {
      name: L("Глэмпинг A-frame", "Glemping A-frame", "A-frame Glamping"),
      text: L(
        "Отдельные домики A-frame с гостиничным комфортом и панорамным окном.",
        "Mehmonxona qulayligiga ega, panoramali derazali alohida A-frame uychalari.",
        "Standalone A-frame cabins with hotel-level comfort and a panoramic window.",
      ),
    },
    tubing: {
      name: L("Тюбинг в огнях", "Chiroqlardagi tyubing", "Tubing under the lights"),
      text: L(
        "Трасса 160 метров, вечером подсвечена по всей длине.",
        "160 metrlik trassa, kechqurun butun uzunligi bo'ylab yoritiladi.",
        "A 160-metre track, lit end to end in the evening.",
      ),
    },
  },

  /**
   * Акции на зимнем экране — те же, что в блоке акций на главной (27.11.2026,
   * владелец: «перенеси все акции туда тоже»). Вторая фраза — чтобы расчёт
   * «2+1» по будничным ночам не приняли за цену новогодней ночи.
   */
  offersTitle: L("Действующие акции", "Amaldagi aksiyalar", "Current offers"),
  offersLead: L(
    "Условия и сроки — в каждой карточке. Цену новогодних ночей покажет онлайн-бронирование.",
    "Shartlar va muddatlar — har bir kartochkada. Yangi yil kechalari narxini onlayn bron ko'rsatadi.",
    "Terms and dates are on each card. Online booking shows the price of New Year nights.",
  ),

  wishTitle: L("Загадайте желание", "Istak tilang", "Make a wish"),
  wishText: L(
    "Нажмите на небо над горами — и запустите свой салют.",
    "Tog'lar ustidagi osmonga bosing — o'z mushakbozligingizni boshlang.",
    "Tap the sky above the mountains to launch your own fireworks.",
  ),
  wishButton: L("Запустить салют", "Mushakbozlikni boshlash", "Launch fireworks"),
} as const;

export const newYearSeo: PageSeo = {
  title: newYearCopy.title,
  description: L(
    "Встречайте 2027 год в CHIMGAN DARBAZA: шале и домики A-frame в горах Чимгана, тюбинг в огнях. Выберите домик на праздники.",
    "2027-yilni CHIMGAN DARBAZA'da kutib oling: Chimyon tog'laridagi shale va A-frame uychalari, chiroqlardagi tyubing. Bayram uchun uycha tanlang.",
    "See in 2027 at CHIMGAN DARBAZA: chalets and A-frame cabins in the Chimgan mountains, tubing under the lights. Choose a cabin for the holidays.",
  ),
};
