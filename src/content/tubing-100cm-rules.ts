import type { LocalizedList, LocalizedString } from "./types";

export type TubingSafetySection = {
  title: LocalizedString;
  items: LocalizedList;
};

/**
 * Актуальные параметры выданного оператором тюбинга.
 *
 * Редакция от 13.08.2026 дополняет исходный DOCX и имеет приоритет в части
 * диаметра, нагрузки, посадки и совместного спуска. Один источник данных
 * используется на странице услуги и в юридических правилах, чтобы цифры не
 * расходились между двумя экранами.
 */
export const tubing100cmRulesVersion = {
  revision: "2",
  amendmentDate: "13.08.2026",
} as const;

export const tubing100cmSummaryTitle: LocalizedString = {
  ru: "Важно перед заявкой",
  uz: "Ariza yuborishdan oldin muhim",
  en: "Important before requesting",
};

export const tubing100cmFormSummary: LocalizedList = {
  ru: [
    "Тюбинг — 100 см; максимальная нагрузка на один тюбинг строго до 95 кг.",
    "Самостоятельный спуск ребёнка — только при надёжной посадке, обычно при росте от 140 см.",
    "Совместный спуск: один взрослый и один ребёнок; суммарный вес также строго до 95 кг.",
  ],
  uz: [
    "Tyubing — 100 sm; bitta tyubing uchun maksimal yuklama qat'iy 95 kg gacha.",
    "Bola mustaqil uchishi uchun ishonchli o'tirishi kerak — odatda bo'yi 140 sm va undan yuqori.",
    "Birga uchish: bir katta odam va bir bola; umumiy vazn ham qat'iy 95 kg gacha.",
  ],
  en: [
    "Tube diameter: 100 cm; maximum load strictly limited to 95 kg per tube.",
    "A child may ride alone only with a secure fit — normally at 140 cm or taller.",
    "Tandem riding: one adult and one child; combined weight also strictly limited to 95 kg.",
  ],
};

export const tubing100cmPolicySections: TubingSafetySection[] = [
  {
    title: {
      ru: "Технические ограничения инвентаря",
      uz: "Inventarning texnik cheklovlari",
      en: "Equipment limits",
    },
    items: {
      ru: [
        "Диаметр тюбинга: 100 см.",
        "Максимальная нагрузка: строго до 95 кг на один тюбинг — как при одиночном, так и при совместном катании.",
      ],
      uz: [
        "Tyubing diametri: 100 sm.",
        "Maksimal yuklama: bitta tyubing uchun qat'iy 95 kg gacha — yakka yoki birga uchishda ham.",
      ],
      en: [
        "Tube diameter: 100 cm.",
        "Maximum load: strictly up to 95 kg per tube, both for solo and tandem riding.",
      ],
    },
  },
  {
    title: {
      ru: "Правила для взрослых — самостоятельное катание",
      uz: "Kattalar uchun qoidalar — mustaqil uchish",
      en: "Rules for adults — solo riding",
    },
    items: {
      ru: [
        "Индивидуальный спуск: на одном тюбинге разрешается кататься только одному человеку, кроме совместного спуска взрослого с маленьким ребёнком по правилам ниже.",
        "Правильная посадка: кататься разрешается исключительно сидя. Необходимо глубоко сесть в центральное углубление, откинуться назад и крепко держаться обеими руками за боковые ручки. Ноги должны быть слегка приподняты и не касаться трассы.",
        "Ограничение по весу: вес катающегося не должен превышать 95 кг во избежание разрыва камеры или потери управляемости.",
        "Запрещённые позы: запрещается спускаться стоя, на коленях, на четвереньках, на животе, спиной или головой вперёд. Тормозить ногами или руками во время движения запрещено.",
      ],
      uz: [
        "Yakka uchish: quyidagi qoidalarga muvofiq katta odamning kichik bola bilan birga uchishidan tashqari, bitta tyubingda faqat bir kishi uchishi mumkin.",
        "To'g'ri o'tirish: faqat o'tirgan holda uchish mumkin. Markaziy chuqurchaga chuqur o'tiring, orqaga suyaning va yon tutqichlarni ikki qo'l bilan mahkam ushlang. Oyoqlar biroz ko'tarilgan bo'lishi va trassaga tegmasligi kerak.",
        "Vazn cheklovi: kameraning yorilishi yoki boshqaruv yo'qolishining oldini olish uchun uchuvchining vazni 95 kg dan oshmasligi kerak.",
        "Taqiqlangan holatlar: tik turib, tizzada, to'rt oyoqlab, qorin bilan, orqa yoki bosh bilan oldinga uchish taqiqlanadi. Harakat vaqtida oyoq yoki qo'l bilan tormozlash taqiqlanadi.",
      ],
      en: [
        "Solo descent: only one person may ride on a tube, except for one adult riding with one small child under the rules below.",
        "Correct position: ride seated only. Sit deep in the centre, lean back and hold both side handles firmly. Keep both feet slightly raised and off the track.",
        "Weight limit: the rider must not weigh more than 95 kg, to avoid tube failure or loss of control.",
        "Prohibited positions: do not ride standing, kneeling, on all fours, on your stomach, backwards or head first. Braking with hands or feet while moving is prohibited.",
      ],
    },
  },
  {
    title: {
      ru: "Правила для детей и совместного спуска",
      uz: "Bolalar va birga uchish qoidalari",
      en: "Rules for children and tandem riding",
    },
    items: {
      ru: [
        "Самостоятельное катание детей разрешено только тогда, когда ребёнок полностью соответствует габаритам 100-сантиметрового тюбинга — обычно это рост от 140 см. Ребёнок должен самостоятельно глубоко сесть, надёжно зафиксироваться внутри тюбинга и без напряжения крепко держаться за ручки.",
        "Если ребёнок болтается внутри, не дотягивается до ручек или не может крепко за них держаться, самостоятельный спуск запрещён. Допускается только совместный спуск с одним взрослым на одном тюбинге.",
        "При совместном спуске ребёнок садится первым лицом по ходу движения, взрослый — позади. Взрослый обязан надёжно удерживать ребёнка ногами и руками, контролировать спуск и крепко держаться за ручки.",
        "Суммарный вес взрослого и ребёнка при совместном спуске не должен превышать 95 кг.",
        "Дети младше 4 лет к спуску не допускаются.",
      ],
      uz: [
        "Bola mustaqil uchishi uchun 100 sm li tyubing o'lchamiga to'liq mos kelishi kerak — odatda bo'yi 140 sm va undan yuqori. Bola mustaqil ravishda chuqur o'tirishi, tyubing ichida ishonchli joylashishi va tutqichlarni zo'riqmasdan mahkam ushlashi kerak.",
        "Agar bola tyubing ichida erkin siljisa, tutqichlarga yetmasa yoki ularni mahkam ushlay olmasa, mustaqil uchish taqiqlanadi. Faqat bir katta odam bilan bitta tyubingda birga uchish mumkin.",
        "Birga uchishda bola harakat yo'nalishiga qarab oldinga o'tiradi, katta odam esa uning orqasiga o'tiradi. Katta odam bolani oyoq va qo'llari bilan ishonchli ushlab, uchishni nazorat qilishi va tutqichlarni mahkam ushlashi shart.",
        "Birga uchishda katta odam va bolaning umumiy vazni 95 kg dan oshmasligi kerak.",
        "4 yoshgacha bo'lgan bolalar uchishga qo'yilmaydi.",
      ],
      en: [
        "A child may ride alone only when they fully fit a 100 cm tube — normally at a height of 140 cm or more. The child must be able to sit deep, stay securely positioned and hold the handles firmly without strain.",
        "If the child moves loosely inside the tube, cannot reach the handles or cannot hold them firmly, solo riding is prohibited. The child may ride only with one adult on the same tube.",
        "For a tandem descent, the child sits first facing forward and the adult sits behind. The adult must hold the child securely with their arms and legs, control the descent and keep a firm hold on the handles.",
        "The combined weight of the adult and child must not exceed 95 kg.",
        "Children under 4 are not permitted to ride.",
      ],
    },
  },
  {
    title: {
      ru: "Общие правила безопасности на трассе",
      uz: "Trassadagi umumiy xavfsizlik qoidalari",
      en: "General track safety rules",
    },
    items: {
      ru: [
        "Начинать спуск можно только после разрешения оператора, когда трасса и зона выката полностью свободны от предыдущих посетителей.",
        "После полной остановки необходимо незамедлительно встать и покинуть зону выката вместе с тюбингом. Возвращаться вверх по трассе спуска запрещено.",
        "Запрещается связывать или сцеплять тюбинги, держаться за руки при параллельном спуске и отталкиваться друг от друга.",
        "Запрещено кататься с острыми или крупными предметами и животными. К спуску не допускаются лица в состоянии алкогольного, наркотического или токсического опьянения либо имеющие медицинские противопоказания к активным нагрузкам.",
      ],
      uz: [
        "Faqat operator ruxsatidan so'ng, trassa va to'xtash hududi avvalgi tashrif buyuruvchilardan to'liq bo'shaganida uchishni boshlash mumkin.",
        "Tyubing to'liq to'xtagach, darhol turib, tyubing bilan birga to'xtash hududini tark etish kerak. Uchish trassasi bo'ylab yuqoriga qaytish taqiqlanadi.",
        "Tyubinglarni bog'lash yoki ulash, parallel uchishda qo'l ushlash va bir-birini itarish taqiqlanadi.",
        "O'tkir yoki katta buyumlar va hayvonlar bilan uchish taqiqlanadi. Alkogol, giyohvand yoki zaharli moddalar ta'siridagi hamda faol jismoniy yuklamaga tibbiy qarshi ko'rsatmasi bor shaxslar uchishga qo'yilmaydi.",
      ],
      en: [
        "Start only after the operator gives permission and the track and run-out area are completely clear of previous riders.",
        "After the tube stops completely, stand up immediately and leave the run-out area with the tube. Do not walk back up the descent track.",
        "Do not tie or connect tubes, hold hands during parallel descents or push away from another rider.",
        "Do not ride with sharp or bulky objects or with animals. Anyone under the influence of alcohol, narcotics or toxic substances, or with medical contraindications to active exertion, is not permitted to ride.",
      ],
    },
  },
];

const flattenRules = (locale: keyof LocalizedList) =>
  tubing100cmPolicySections.flatMap((section) => [section.title[locale], ...section.items[locale]]);

/** Localized safety annex embedded in the Public Offer. */
export const tubing100cmOfferSection: TubingSafetySection = {
  title: {
    ru: "Приложение № 1. 6А. Актуальные правила для тюбингов диаметром 100 см",
    uz: "1-ilova. 6A. Diametri 100 sm bo'lgan tyubinglar uchun amaldagi qoidalar",
    en: "Appendix 1. 6A. Current rules for 100 cm tubes",
  },
  items: {
    ru: [
      "Редакция № 2 от 13.08.2026. Настоящий раздел имеет приоритет при расхождениях в части диаметра, нагрузки, посадки, допуска детей и совместного спуска.",
      ...flattenRules("ru"),
    ],
    uz: [
      "13.08.2026 dagi 2-sonli tahrir. Diametr, yuklama, o'tirish holati, bolalarni qo'yish va birga uchish bo'yicha tafovut bo'lsa, ushbu bo'lim ustuvor hisoblanadi.",
      ...flattenRules("uz"),
    ],
    en: [
      "Revision 2 dated 13 August 2026. If another clause differs on diameter, load, riding position, child eligibility or tandem riding, this section takes priority.",
      ...flattenRules("en"),
    ],
  },
};
