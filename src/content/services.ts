import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type Service = {
  slug: string;
  category: "relax" | "food" | "activity" | "sport" | "family";
  image: keyof typeof resortImages;
  title: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  highlights: LocalizedList;
  bestFor: LocalizedString;
  ctaLabel?: LocalizedString;
};

export const services: Service[] = [
  {
    slug: "pool",
    category: "relax",
    image: "pool",
    title: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
    shortDescription: {
      ru: "Открытая водная зона для летнего отдыха и спокойных дней у воды.",
      uz: "Yozgi hordiq va suv bo'yida sokin kunlar uchun ochiq basseyn.",
      en: "An outdoor water area for summer rest and calm days by the pool.",
    },
    description: {
      ru: "Бассейн дополняет проживание и дневные визиты: лежаки, свежий воздух, удобный доступ к ресторану и зонам отдыха.",
      uz: "Basseyn yashash va kunlik tashriflarni to'ldiradi: shezlonglar, toza havo, restoran va dam olish zonalariga qulay o'tish.",
      en: "The pool supports both stays and day visits with loungers, fresh air, and easy access to the restaurant and lounge zones.",
    },
    highlights: {
      ru: ["Летний формат", "Лежаки и тень", "Рядом ресторан", "Подходит для семей"],
      uz: ["Yozgi format", "Shezlong va soya", "Restoran yonida", "Oilalar uchun mos"],
      en: ["Summer format", "Loungers and shade", "Restaurant nearby", "Family-friendly"],
    },
    bestFor: { ru: "Летний день на курорте", uz: "Kurortdagi yozgi kun", en: "A summer resort day" },
  },
  {
    slug: "tapchan-zone",
    category: "relax",
    image: "tapchan",
    title: { ru: "Топчан зона", uz: "Topchan zonasi", en: "Tapchan zone" },
    shortDescription: {
      ru: "Тихие посадочные зоны для отдыха, чая, общения и дневного визита.",
      uz: "Dam olish, choy, suhbat va kunlik tashrif uchun sokin topchan hududlari.",
      en: "Quiet lounge platforms for tea, conversation, and day visits.",
    },
    description: {
      ru: "Топчаны помогают провести день в комфортном ритме: заказать еду, спрятаться от солнца, встретиться с друзьями или отдохнуть после прогулки.",
      uz: "Topchanlar kunni qulay ritmda o'tkazishga yordam beradi: taom buyurtma qilish, quyoshdan pana bo'lish, do'stlar bilan uchrashish yoki sayrdan keyin dam olish.",
      en: "Tapchan platforms help guests spend the day at an easy pace: order food, find shade, meet friends, or rest after a walk.",
    },
    highlights: {
      ru: ["Приватные посадки", "Сервис еды и напитков", "Тень и вид на природу", "Удобно для компаний"],
      uz: ["Xususiy o'tirish joylari", "Taom va ichimlik servisi", "Soya va tabiat manzarasi", "Do'stlar davrasi uchun qulay"],
      en: ["Private seating", "Food and drink service", "Shade with nature views", "Convenient for groups"],
    },
    bestFor: { ru: "Спокойный дневной отдых", uz: "Sokin kunlik dam olish", en: "Calm daytime rest" },
  },
  {
    slug: "picnic-zone",
    category: "relax",
    image: "picnic",
    title: { ru: "Пикник зона", uz: "Piknik zonasi", en: "Picnic zone" },
    shortDescription: {
      ru: "Открытые площадки для семейных встреч и отдыха на природе.",
      uz: "Oilaviy uchrashuvlar va tabiat qo'ynida dam olish uchun ochiq maydonlar.",
      en: "Open areas for family gatherings and nature-forward rest.",
    },
    description: {
      ru: "Пикник зона рассчитана на легкий формат отдыха: свежий воздух, удобная посадка, близость к прогулочным маршрутам и возможность добавить сервис кухни.",
      uz: "Piknik zonasi yengil dam olish formati uchun: toza havo, qulay o'tirish, sayr yo'llariga yaqinlik va oshxona servisiga ulanish.",
      en: "The picnic zone is built for easy outdoor time with seating, walking routes nearby, and optional food service.",
    },
    highlights: {
      ru: ["Для семей и друзей", "Открытая территория", "Можно сочетать с грилем", "Рядом активности"],
      uz: ["Oila va do'stlar uchun", "Ochiq hudud", "Gril bilan birlashtirish mumkin", "Faoliyatlar yaqin"],
      en: ["For families and friends", "Open territory", "Can pair with grill", "Activities nearby"],
    },
    bestFor: { ru: "Выезд на день", uz: "Bir kunlik sayohat", en: "A day trip" },
  },
  {
    slug: "experience",
    category: "activity",
    image: "activity",
    title: { ru: "Впечатления и активности", uz: "Tajriba va faoliyatlar", en: "Experiences and activities" },
    shortDescription: {
      ru: "Маршруты, прогулки, лошади, квадроциклы, экскурсии и канатные дороги рядом с курортом.",
      uz: "Kurort yaqinidagi marshrutlar, sayrlar, ot minish, kvadrotsikllar, ekskursiyalar va kanat yo'llari.",
      en: "Routes, walks, horse riding, quad bikes, excursions, and cable cars around the resort.",
    },
    description: {
      ru: "Команда курорта помогает собрать день под темп гостей: спокойные прогулки, семейные маршруты, активные выезды и сезонные впечатления.",
      uz: "Kurort jamoasi mehmonlar ritmiga mos kunni tuzishda yordam beradi: sokin sayrlar, oilaviy marshrutlar, faol chiqishlar va mavsumiy taassurotlar.",
      en: "The resort team can shape a day around each guest's pace: gentle walks, family routes, active rides, and seasonal experiences.",
    },
    highlights: {
      ru: ["Пешие маршруты", "Конные прогулки", "Квадроциклы", "Экскурсии и канатные дороги"],
      uz: ["Piyoda marshrutlar", "Ot minish", "Kvadrotsikllar", "Ekskursiyalar va kanat yo'llari"],
      en: ["Hiking routes", "Horse riding", "Quad bikes", "Excursions and cable cars"],
    },
    bestFor: { ru: "Гости, которым нужен маршрут", uz: "Marshrut istagan mehmonlar", en: "Guests who want an itinerary" },
  },
  {
    slug: "restaurant",
    category: "food",
    image: "restaurant",
    title: { ru: "Ресторан", uz: "Restoran", en: "Restaurant" },
    shortDescription: {
      ru: "Сезонное меню, завтраки, семейные обеды и ужины после активного дня.",
      uz: "Mavsumiy menyu, nonushtalar, oilaviy tushlik va faol kundan keyingi kechki ovqatlar.",
      en: "Seasonal menu, breakfasts, family lunches, and dinners after active days.",
    },
    description: {
      ru: "Ресторан работает как центральная точка курорта: сюда удобно прийти после бассейна, прогулки или заселения. Меню можно адаптировать под семейные визиты и небольшие события.",
      uz: "Restoran kurortning markaziy nuqtasi sifatida ishlaydi: basseyn, sayr yoki joylashuvdan keyin kelish qulay. Menyu oilaviy tashriflar va kichik tadbirlar uchun moslashtiriladi.",
      en: "The restaurant acts as the resort's central meeting point after the pool, a walk, or check-in. The menu can support family visits and small events.",
    },
    highlights: {
      ru: ["Завтраки", "Сезонные блюда", "Семейные столы", "Бронирование посадки"],
      uz: ["Nonushtalar", "Mavsumiy taomlar", "Oilaviy stollar", "Joy band qilish"],
      en: ["Breakfasts", "Seasonal dishes", "Family tables", "Table booking"],
    },
    bestFor: { ru: "Завтрак, обед и ужин на территории", uz: "Hududda nonushta, tushlik va kechki ovqat", en: "Breakfast, lunch, and dinner on site" },
  },
  {
    slug: "tubing-track",
    category: "activity",
    image: "tubing",
    title: { ru: "Тюбинг трасса", uz: "Tubing trassasi", en: "Tubing track" },
    shortDescription: {
      ru: "Сезонная трасса для зимнего отдыха и активного семейного дня.",
      uz: "Qishki hordiq va faol oilaviy kun uchun mavsumiy trassa.",
      en: "A seasonal track for winter fun and active family days.",
    },
    description: {
      ru: "Тюбинг добавляет курорту зимний сценарий: быстрые заезды, контроль посадки и возможность совместить активность с теплым рестораном.",
      uz: "Tubing kurortga qishki ssenariy qo'shadi: tez tushishlar, nazoratli start va faoliyatni iliq restoran bilan birlashtirish.",
      en: "Tubing gives the resort a winter scenario with fast runs, controlled starts, and a warm restaurant nearby.",
    },
    highlights: {
      ru: ["Зимний сезон", "Для детей и взрослых", "Прокат по расписанию", "Рядом теплые зоны"],
      uz: ["Qish mavsumi", "Bolalar va kattalar uchun", "Jadval bo'yicha ijara", "Iliq zonalar yaqin"],
      en: ["Winter season", "For kids and adults", "Scheduled rental", "Warm areas nearby"],
    },
    bestFor: { ru: "Зимние выходные", uz: "Qishki dam olish kunlari", en: "Winter weekends" },
  },
  {
    slug: "workout-zone",
    category: "sport",
    image: "sport",
    title: { ru: "Workout зона", uz: "Workout zonasi", en: "Workout zone" },
    shortDescription: {
      ru: "Открытая спортивная площадка для утренних тренировок и активного ритма.",
      uz: "Ertalabki mashg'ulotlar va faol ritm uchun ochiq sport maydoni.",
      en: "An outdoor sports area for morning workouts and an active rhythm.",
    },
    description: {
      ru: "Workout зона поддерживает гостей, которые хотят сохранить спортивный режим во время отдыха: свежий воздух, базовое оборудование и удобная локация.",
      uz: "Workout zonasi dam olish vaqtida sport rejimini saqlashni istagan mehmonlarni qo'llab-quvvatlaydi: toza havo, asosiy jihozlar va qulay joylashuv.",
      en: "The workout zone supports guests who want to keep a fitness rhythm while away, with fresh air, basic equipment, and a practical location.",
    },
    highlights: {
      ru: ["Открытый воздух", "Утренние тренировки", "Базовые снаряды", "Рядом прогулочные маршруты"],
      uz: ["Ochiq havo", "Ertalabki mashqlar", "Asosiy jihozlar", "Sayr marshrutlari yaqin"],
      en: ["Open air", "Morning training", "Basic equipment", "Walking routes nearby"],
    },
    bestFor: { ru: "Активное утро", uz: "Faol tong", en: "An active morning" },
  },
  {
    slug: "padel-courts",
    category: "sport",
    image: "padel",
    title: { ru: "Падел корты", uz: "Padel kortlari", en: "Padel courts" },
    shortDescription: {
      ru: "Современный спортивный формат для друзей, пар и корпоративных выездов.",
      uz: "Do'stlar, juftliklar va korporativ sayohatlar uchun zamonaviy sport formati.",
      en: "A modern sport format for friends, couples, and corporate trips.",
    },
    description: {
      ru: "Падел легко встроить в программу дня: сыграть утром, продолжить отдых у бассейна и завершить ужином на территории.",
      uz: "Padelni kun dasturiga oson qo'shish mumkin: ertalab o'yin, basseyn yonida hordiq va hududda kechki ovqat.",
      en: "Padel fits naturally into a resort day: play in the morning, rest by the pool, and finish with dinner on site.",
    },
    highlights: {
      ru: ["Игровой формат", "Для 2-4 игроков", "Инвентарь по запросу", "Подходит для корпоративов"],
      uz: ["O'yin formati", "2-4 o'yinchi uchun", "Inventar so'rov bo'yicha", "Korporativlar uchun mos"],
      en: ["Game format", "For 2-4 players", "Equipment on request", "Works for corporate visits"],
    },
    bestFor: { ru: "Спортивная встреча", uz: "Sport uchrashuvi", en: "A social sport session" },
  },
  {
    slug: "kids-playground",
    category: "family",
    image: "kids",
    title: { ru: "Детская площадка", uz: "Bolalar maydonchasi", en: "Kids playground" },
    shortDescription: {
      ru: "Семейная зона, где детям удобно переключиться между активностями.",
      uz: "Bolalar faoliyatlar orasida qulay almashishi uchun oilaviy hudud.",
      en: "A family zone where children can switch between activities comfortably.",
    },
    description: {
      ru: "Детская площадка помогает родителям планировать спокойный день на территории: рядом посадочные зоны, ресторан и прогулочные маршруты.",
      uz: "Bolalar maydonchasi ota-onalarga hududda sokin kun rejalashga yordam beradi: o'tirish joylari, restoran va sayr yo'llari yaqin.",
      en: "The playground helps parents plan a calm day on the territory, with seating, the restaurant, and walking routes nearby.",
    },
    highlights: {
      ru: ["Для семей", "Рядом зоны отдыха", "Удобно при проживании", "Часть дневного маршрута"],
      uz: ["Oilalar uchun", "Dam olish zonalari yaqin", "Yashashda qulay", "Kunlik marshrut qismi"],
      en: ["For families", "Lounge zones nearby", "Convenient during stays", "Part of a day route"],
    },
    bestFor: { ru: "Семейный отдых", uz: "Oilaviy dam olish", en: "Family stays" },
  },
  {
    slug: "mini-football",
    category: "sport",
    image: "football",
    title: { ru: "Мини-футбольное поле", uz: "Mini futbol maydoni", en: "Mini football field" },
    shortDescription: {
      ru: "Поле для дружеских матчей, детских игр и командных выездов.",
      uz: "Do'stona o'yinlar, bolalar o'yinlari va jamoaviy sayohatlar uchun maydon.",
      en: "A field for friendly matches, children's games, and team visits.",
    },
    description: {
      ru: "Мини-футбол добавляет энергии дневным визитам и корпоративным программам. Площадку удобно комбинировать с пикником, рестораном и зонами отдыха.",
      uz: "Mini futbol kunlik tashriflar va korporativ dasturlarga energiya qo'shadi. Maydonni piknik, restoran va dam olish zonalari bilan birlashtirish qulay.",
      en: "Mini football adds energy to day visits and corporate programs. It pairs well with picnic zones, restaurant service, and lounge areas.",
    },
    highlights: {
      ru: ["Командный формат", "Для детей и взрослых", "Подходит для корпоративов", "Рядом пикник зона"],
      uz: ["Jamoaviy format", "Bolalar va kattalar uchun", "Korporativlar uchun mos", "Piknik zonasi yaqin"],
      en: ["Team format", "For children and adults", "Works for corporate visits", "Picnic zone nearby"],
    },
    bestFor: { ru: "Командный день", uz: "Jamoaviy kun", en: "A team day" },
  },
  {
    slug: "outdoor-cooking",
    category: "food",
    image: "grill",
    title: { ru: "Гриль, казан и outdoor cooking", uz: "Gril, qozon va outdoor cooking", en: "Grill, kazan and outdoor cooking" },
    shortDescription: {
      ru: "Отдельная зона для плова, шашлыка, гриля и теплых вечеров на природе.",
      uz: "Palov, shashlik, gril va tabiatdagi iliq kechalar uchun alohida hudud.",
      en: "A dedicated zone for plov, barbecue, grill, and warm outdoor evenings.",
    },
    description: {
      ru: "Зона outdoor cooking рассчитана на компании и семьи, которым важен живой формат отдыха: готовка на воздухе, посадка рядом и возможность заранее согласовать сервис.",
      uz: "Outdoor cooking zonasi jonli dam olish formatini istagan kompaniya va oilalar uchun: ochiq havoda tayyorlash, yonidagi o'tirish joyi va servisni oldindan kelishish.",
      en: "The outdoor cooking zone is for groups and families who value a lively format: open-air cooking, nearby seating, and service coordination in advance.",
    },
    highlights: {
      ru: ["Гриль и казан", "Для компаний", "Посадка рядом", "Сервис по запросу"],
      uz: ["Gril va qozon", "Kompaniyalar uchun", "Yonida o'tirish joyi", "So'rov bo'yicha servis"],
      en: ["Grill and kazan", "For groups", "Nearby seating", "Service on request"],
    },
    bestFor: { ru: "Вечер с компанией", uz: "Do'stlar bilan kecha", en: "An evening with a group" },
  },
];

export const serviceCategories = [
  { id: "all", label: { ru: "Все", uz: "Barchasi", en: "All" } },
  { id: "relax", label: { ru: "Отдых", uz: "Dam olish", en: "Relax" } },
  { id: "food", label: { ru: "Еда", uz: "Taom", en: "Food" } },
  { id: "activity", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
  { id: "sport", label: { ru: "Спорт", uz: "Sport", en: "Sport" } },
  { id: "family", label: { ru: "Семья", uz: "Oila", en: "Family" } },
] as const;
