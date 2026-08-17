import type { PolicyPage } from "./policies";
import { legalPolicies } from "./policies-legal";
import { amend, poolAroundStaySection } from "./policies-legal-amendments";
import { poolPricing } from "./pricing";

/**
 * Правила посещения бассейна — отдельная страница, потому что гость обязан
 * подтвердить согласие с ними перед отправкой заявки (оператор, 17.08.2026).
 *
 * ТЕКСТ НЕ НАПИСАН ЗАНОВО. Официальные правила уже существуют: это Приложение
 * № 1, раздел 5 Публичной оферты — двадцать пунктов, подписанных юристом, где
 * есть и запрет своей еды, и купальный костюм, и присмотр за детьми. Написать
 * рядом «свои» правила бассейна значило бы завести второй текст о том же, и
 * разошлись бы они на первой правке — ровно та ошибка, из-за которой сайт
 * когда-то обещал невозвратную предоплату вопреки подписанной политике.
 *
 * Поэтому раздел вынимается из документа и показывается отдельной страницей:
 * гостю, которого просят «ознакомиться с правилами бассейна», незачем искать
 * пятое приложение внутри восьмидесятистраничной оферты.
 *
 * Часы работы — единственное, что добавлено сверху, и добавлено законно:
 * п. 5.2 самого документа говорит, что режим работы устанавливается
 * Исполнителем и публикуется на Сайте. Вот он и публикуется, из той же
 * константы, что и остальные страницы.
 */
const POOL_SECTION = "ПРАВИЛА ПОСЕЩЕНИЯ ПАНОРАМНОГО БАССЕЙНА";

/** Раздел оферты про бассейн — с уже применёнными поправками оператора. */
function officialPoolSections() {
  const offer = legalPolicies.find((p) => p.slug === "public-offer");
  if (!offer) return [];
  return amend(offer).sections.filter((s) => s.title.ru.includes(POOL_SECTION));
}

const hoursSection: PolicyPage["sections"][number] = {
  title: { ru: "Часы работы", uz: "Ish vaqti", en: "Opening hours" },
  items: {
    ru: [
      `Для гостей, проживающих в шале и глэмпинге, — ежедневно ${poolPricing.hoursForStayingGuests}.`,
      `Для посетителей без проживания — ежедневно ${poolPricing.hours}.`,
      "Пикник-зона с топчанами работает по своему времени — оно указано на странице топчана.",
      "Режим работы устанавливается Исполнителем и публикуется здесь и на информационных стендах — пункт 5.2 ниже.",
    ],
    uz: [
      `Shale va glempingda yashovchi mehmonlar uchun — har kuni ${poolPricing.hoursForStayingGuests}.`,
      `Yashamaydigan tashrif buyuruvchilar uchun — har kuni ${poolPricing.hours}.`,
      "Topchanli piknik zonasi o'z vaqtida ishlaydi — u topchan sahifasida ko'rsatilgan.",
      "Ish vaqtini Ijrochi belgilaydi va shu yerda hamda axborot stendlarida e'lon qiladi — quyidagi 5.2-band.",
    ],
    en: [
      `For guests staying in a chalet or glamping cabin — daily ${poolPricing.hoursForStayingGuests}.`,
      `For visitors without a stay — daily ${poolPricing.hours}.`,
      "The picnic zone with topchans keeps its own hours — see the topchan page.",
      "Hours are set by the operator and published here and on the on-site boards — clause 5.2 below.",
    ],
  },
};

export const poolRulesPolicy: PolicyPage = {
  slug: "pool-rules",
  indexable: true,
  title: {
    ru: "Правила посещения бассейна",
    uz: "Basseynga tashrif qoidalari",
    en: "Pool rules",
  },
  description: {
    ru: "Часы работы и официальные правила посещения панорамного бассейна CHIMGAN DARBAZA — раздел 5 Приложения № 1 к Публичной оферте.",
    uz: "CHIMGAN DARBAZA panoramali basseynining ish vaqti va rasmiy tashrif qoidalari — Ommaviy ofertaga 1-ilovaning 5-bo'limi. Rasmiy matn rus tilida.",
    en: "Opening hours and the official rules for the CHIMGAN DARBAZA panoramic pool — Annex 1, section 5 of the Public Offer. The official text is in Russian.",
  },
  // Условия «до заезда / после выезда» — тоже про бассейн, и гость, который
  // читает правила перед оплатой, должен видеть их здесь, а не только в оферте.
  sections: [hoursSection, ...officialPoolSections(), poolAroundStaySection],
};
