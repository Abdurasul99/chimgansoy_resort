import type { PolicyPage } from "./policies";

/**
 * Сертификат соответствия Комитета по туризму — сканы выданного документа.
 *
 * Страница стоит рядом с офертой намеренно: гость, который дочитал до правовых
 * документов, обычно проверяет, кому он вообще платит. Номер, срок и орган,
 * выдавший сертификат, отвечают на это без звонка администратору.
 *
 * ЦИФРЫ ЗДЕСЬ — ЦИТАТА ИЗ ДОКУМЕНТА, А НЕ ДАННЫЕ САЙТА. «20 коттеджей на 60
 * мест» переписано с бланка и меняется только вместе с ним; вместимость,
 * которую сайт показывает гостю, живёт в rooms.ts и pricing.ts. Если однажды
 * они разойдутся — прав будет бланк, а расхождение означает, что сертификат
 * пора переоформлять.
 */
export const certificatePolicy: PolicyPage = {
  slug: "sertifikat",
  indexable: true,
  title: {
    ru: "Сертификат соответствия",
    uz: "Muvofiqlik sertifikati",
    en: "Certificate of conformity",
  },
  description: {
    ru: "Гостиничные услуги CHIMGAN DARBAZA сертифицированы Комитетом по туризму Республики Узбекистан. Номер, срок действия и скан документа.",
    uz: "CHIMGAN DARBAZA mehmonxona xizmatlari O'zbekiston Respublikasi Turizm qo'mitasi tomonidan sertifikatlangan. Raqami, amal qilish muddati va hujjat nusxasi.",
    en: "CHIMGAN DARBAZA hotel services are certified by the Tourism Committee of the Republic of Uzbekistan. Number, validity period and a scan of the document.",
  },
  document: {
    file: "/documents/sertifikat-muvofiqlik-2026.pdf",
    preview: "/images/legal/sertifikat-muvofiqlik-2026.webp",
    previewFallback: "/images/legal/sertifikat-muvofiqlik-2026.jpg",
    width: 1200,
    height: 1697,
    caption: {
      ru: "Сертификат соответствия № UZ.SMT.02.0003.018818, бланк № 007363",
      uz: "Muvofiqlik sertifikati № UZ.SMT.02.0003.018818, blank № 007363",
      en: "Certificate of conformity No. UZ.SMT.02.0003.018818, form No. 007363",
    },
    download: {
      ru: "Скачать сертификат (PDF)",
      uz: "Sertifikatni yuklab olish (PDF)",
      en: "Download the certificate (PDF)",
    },
  },
  sections: [
    {
      title: { ru: "Что подтверждает документ", uz: "Hujjat nimani tasdiqlaydi", en: "What the document confirms" },
      items: {
        ru: [
          "Гостиничные услуги зоны отдыха «CHIMGAN DARBAZA» соответствуют требованиям стандарта O'z MSt 958:2026.",
          "Средству размещения присвоена категория.",
          "Сертификат распространяется на 20 коттеджей на 60 мест.",
        ],
        uz: [
          "«CHIMGAN DARBAZA» dam olish zonasining mehmonxona xizmatlari O'z MSt 958:2026 standarti talablariga muvofiq.",
          "Joylashtirish vositasiga toifa berildi.",
          "Sertifikat 20 ta kottedj va 60 ta joyga taalluqli.",
        ],
        en: [
          "Hotel services of the CHIMGAN DARBAZA resort meet the requirements of standard O'z MSt 958:2026.",
          "The accommodation facility has been assigned a category.",
          "The certificate covers 20 cottages with 60 beds.",
        ],
      },
    },
    {
      title: { ru: "Реквизиты", uz: "Rekvizitlar", en: "Details" },
      items: {
        ru: [
          "Номер в Государственном реестре: UZ.SMT.02.0003.018818.",
          "Дата регистрации: 16 сентября 2026 года.",
          "Действует до: 9 апреля 2031 года.",
          "Выдан: государственное учреждение «Центр сертификации туристских услуг» Комитета по туризму Республики Узбекистан.",
          "Основание: решения № 111 от 6 апреля 2026 года и № 30/QR от 16 сентября 2026 года.",
        ],
        uz: [
          "Davlat reestridagi raqami: UZ.SMT.02.0003.018818.",
          "Ro'yxatga olish sanasi: 2026-yil 16-sentabr.",
          "Amal qilish muddati: 2031-yil 9-aprelgacha.",
          "Bergan tashkilot: O'zbekiston Respublikasi Turizm qo'mitasining «Turizm xizmatlarini sertifikatlashtirish markazi» davlat muassasasi.",
          "Asos: 2026-yil 6-apreldagi 111-sonli va 2026-yil 16-sentabrdagi 30/QR-sonli qarorlar.",
        ],
        en: [
          "State register number: UZ.SMT.02.0003.018818.",
          "Registered on 16 September 2026.",
          "Valid until 9 April 2031.",
          "Issued by the Tourism Services Certification Centre, a state institution of the Tourism Committee of the Republic of Uzbekistan.",
          "Issued under decisions No. 111 of 6 April 2026 and No. 30/QR of 16 September 2026.",
        ],
      },
    },
    {
      title: { ru: "На кого выдан", uz: "Kimga berilgan", en: "Issued to" },
      items: {
        ru: [
          "Организация: ООО «YOSHLAR SPORT VA SOGLOMLASHTIRISH».",
          "Адрес объекта: Ташкентская область, Бостанлыкский район, МФЙ Газалкент, улица Белдирсой, дом 111.",
        ],
        uz: [
          "Tashkilot: «YOSHLAR SPORT VA SOGLOMLASHTIRISH» MChJ.",
          "Obyekt manzili: Toshkent viloyati, Bo'stonliq tumani, G'azalkent MFY, Beldirsoy ko'chasi, 111-uy.",
        ],
        en: [
          "Company: YOSHLAR SPORT VA SOGLOMLASHTIRISH LLC.",
          "Address: 111 Beldirsoy Street, Gazalkent MFY, Bostanlyk District, Tashkent Region.",
        ],
      },
    },
    {
      title: { ru: "Контроль", uz: "Nazorat", en: "Supervision" },
      items: {
        ru: ["В период действия сертификата проводится три инспекционные проверки."],
        uz: ["Sertifikat amal qilish davrida uch marotaba inspeksiya nazorati o'tkaziladi."],
        en: ["Three inspection audits are carried out during the certificate's validity period."],
      },
    },
  ],
};
