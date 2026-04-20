import type { LocalizedString } from "./types";

export type Testimonial = {
  name: string;
  meta: LocalizedString;
  quote: LocalizedString;
};

export const testimonials: Testimonial[] = [
  {
    name: "Dilnoza",
    meta: { ru: "семейный отдых", uz: "oilaviy dam olish", en: "family stay" },
    quote: {
      ru: "Понравилось, что территория спокойная: дети гуляли рядом, а мы успели отдохнуть на топчане и поужинать без спешки.",
      uz: "Hudud sokinligi yoqdi: bolalar yonimizda sayr qildi, biz topchanda dam olib, shoshilmasdan kechki ovqat qildik.",
      en: "We liked how calm the territory felt: the kids could walk nearby while we rested on a tapchan and had dinner without rushing.",
    },
  },
  {
    name: "Aziz",
    meta: { ru: "выезд с друзьями", uz: "do'stlar bilan sayohat", en: "trip with friends" },
    quote: {
      ru: "Удобный формат на один день: ресторан, прогулка, гриль зона и красивые виды. Хочется вернуться с ночевкой.",
      uz: "Bir kunlik format juda qulay: restoran, sayr, gril zonasi va chiroyli manzaralar. Keyingi safar tunab qolishni xohlaymiz.",
      en: "A convenient day format: restaurant, walking, grill zone, and beautiful views. Next time we want to stay overnight.",
    },
  },
  {
    name: "Marina",
    meta: { ru: "короткий отпуск", uz: "qisqa ta'til", en: "short break" },
    quote: {
      ru: "Глэмпинг дал ощущение уединения, но при этом все нужное было рядом. Хороший вариант для перезагрузки.",
      uz: "Glemping xotirjamlik hissini berdi, lekin kerakli hamma narsa yaqin edi. Hordiq uchun yaxshi variant.",
      en: "The glamping stay felt private, while everything we needed was close by. A strong option for a reset.",
    },
  },
];
