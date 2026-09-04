import type { LocalizedString } from "./types";

/**
 * Бассейн временно не работает — один выключатель на весь сайт.
 *
 * Оператор закрыл бассейн 27.08.2026. Выключить его через панель на
 * chimgansoy.com было нельзя: там выключатель есть только у УСЛУГ
 * (src/lib/site-overrides.ts), а бассейн заведён как объект размещения в
 * rooms.ts — у домиков такого переключателя нет вовсе.
 *
 * Поэтому флаг живёт в коде и один: страница, форма, серверное действие,
 * ссылки в меню и на главной, карта сайта и брифинг ИИ читают его отсюда.
 * Разложить это по десяти файлам значило бы, что через неделю бассейн в
 * половине мест снова «работает».
 *
 * Чтобы открыть бассейн обратно — поставить closed: false. Больше ничего
 * менять не нужно.
 */
export const poolClosure = {
  closed: true,
  /** Дата распоряжения оператора — попадает в примечание и в брифинг ИИ. */
  since: "27.08.2026",

  /** Заголовок на странице бассейна и в карточках. */
  title: {
    ru: "Бассейн временно не работает",
    uz: "Basseyn vaqtincha ishlamaydi",
    en: "The pool is temporarily closed",
  } satisfies LocalizedString,

  /**
   * Пояснение. Срок открытия намеренно не назван: обещанная дата, которую
   * потом сдвинут, злит сильнее, чем её отсутствие.
   */
  text: {
    ru: "Бассейн закрыт на технические работы. Заявки на посещение бассейна сейчас не принимаются. Об открытии сообщим на сайте и в Instagram.",
    uz: "Basseyn texnik ishlar sababli yopiq. Hozircha basseynga arizalar qabul qilinmaydi. Ochilishi haqida saytda va Instagram'da xabar beramiz.",
    en: "The pool is closed for maintenance. We are not accepting pool requests at the moment. We will announce the reopening on the site and on Instagram.",
  } satisfies LocalizedString,

  /** Что предложить вместо него — гость пришёл отдыхать, а не читать отказ. */
  alternative: {
    ru: "Топчаны в пикник-зоне и тюбинговая горка работают как обычно.",
    uz: "Piknik zonasidagi topchanlar va tyubing gorkasi odatdagidek ishlaydi.",
    en: "The topchans in the picnic area and the tubing slope are open as usual.",
  } satisfies LocalizedString,

  /** Ответ формы, если заявку всё же попытались отправить. */
  formError: {
    ru: "Бассейн временно не работает — заявки не принимаются. Позвоните нам, если нужен топчан или тюбинг.",
    uz: "Basseyn vaqtincha ishlamaydi — arizalar qabul qilinmaydi. Topchan yoki tyubing kerak bo'lsa, qo'ng'iroq qiling.",
    en: "The pool is temporarily closed — requests are not accepted. Call us if you need a topchan or tubing.",
  } satisfies LocalizedString,
} as const;
