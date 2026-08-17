import type { PolicyPage } from "./policies";
import { poolPricing, stayRules } from "./pricing";

/**
 * Распоряжения оператора, изменяющие текст подписанных документов.
 *
 * policies-legal.ts генерируется из .docx и руками не правится — иначе первая
 * же пересборка молча вернёт старую редакцию. Но между распоряжением оператора
 * и новой редакцией документа проходят недели, а ресепшен работает по
 * распоряжению уже сегодня. Всё это время сайт обязан говорить то же, что
 * говорит администратор по телефону.
 *
 * Поэтому поправки живут здесь, отдельным слоем поверх сгенерированного
 * текста, и каждая несёт: что было, что стало, кто распорядился и когда.
 * Пересборка документов слой не затрагивает; когда юрист выпустит новую
 * редакцию, поправку нужно удалить — тест ниже об этом напомнит, если
 * исходная формулировка исчезнет.
 *
 * ЭТО НЕ СПОСОБ «ПОДПРАВИТЬ ДОГОВОР». Сюда попадает только то, что оператор
 * распорядился изменить явно, и только в сторону, которую он назвал.
 */
type Amendment = {
  /** Что заменяем — фрагмент из сгенерированного текста, дословно. */
  from: string;
  /** На что. */
  to: string;
  /** Кто распорядился и когда. Попадает в примечание на странице. */
  note: string;
};

const PREPAY_HOURS = stayRules.prepayWithin.ru;

/**
 * Срок предоплаты: сутки → час (оператор, 17.08.2026).
 *
 * Оферта, пп. 1.2 и 3.6, и Политика возврата дают 24 часа. Оператор сократил
 * срок до одного часа с момента оформления брони и добавил автоматическую
 * отмену. Пока документ не перевыпущен, страница показывает срок оператора и
 * прямо говорит, что он изменён распоряжением, — иначе гость прочтёт сутки,
 * не заплатит через час и потеряет бронь, будучи уверенным в своей правоте.
 */
const AMENDMENTS: Amendment[] = [
  {
    from:
      "Предоплата вносится в течение 24 (двадцати четырёх) часов с момента получения подтверждения бронирования от Исполнителя, а при оформлении бронирования менее чем за 24 часа до даты заезда (визита) – незамедлительно.",
    to: `Предоплата вносится в течение ${PREPAY_HOURS} (одного) часа с момента оформления бронирования. По истечении указанного срока бронирование автоматически аннулируется и считается недействительным.`,
    note: "Срок предоплаты изменён распоряжением оператора от 17.08.2026: один час вместо суток. Новая редакция документа готовится.",
  },
  {
    from:
      "Предоплата вносится в течение 24 (двадцати четырёх) часов с момента получения подтверждения бронирования от Исполнителя. При оформлении бронирования менее чем за 24 часа до даты заезда (визита) предоплата вносится незамедлительно.",
    to: `Предоплата вносится в течение ${PREPAY_HOURS} (одного) часа с момента оформления бронирования. По истечении указанного срока бронирование автоматически аннулируется и считается недействительным.`,
    note: "Срок предоплаты изменён распоряжением оператора от 17.08.2026: один час вместо суток. Новая редакция документа готовится.",
  },
];

/**
 * Тот же разделитель разрядов, что и во всех остальных текстах сайта.
 *
 * toLocaleString ставит НЕРАЗРЫВНЫЙ пробел, и «100 000» из документа переставало
 * совпадать с «100 000» из формы — на глаз одинаково, для поиска и для теста
 * разные строки.
 */
const money = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/**
 * Дополнительные условия, которых в подписанном документе нет вовсе.
 *
 * Замена тут не подходит: оператор не исправил пункт, а добавил новый случай —
 * бассейн вокруг проживания. Раздел приписывается к оферте с датой распоряжения,
 * чтобы гость видел, что это добавление, а не часть исходного текста.
 *
 * Сумма берётся из той же константы, что и админка с формой: цифра, вписанная
 * сюда руками, разошлась бы с прайсом при первой правке оператора.
 */
export const poolAroundStaySection = {
  title: {
    ru: "Дополнительные условия посещения бассейна (распоряжение оператора от 17.08.2026)",
    uz: "Basseynga tashrif uchun qo'shimcha shartlar (operator farmoyishi, 17.08.2026)",
    en: "Additional pool conditions (operator's order of 17.08.2026)",
  },
  items: {
    ru: [
      "До заезда: гость с подтверждённой бронью вправе пользоваться бассейном, ожидая заселения, — до наступления расчётного времени заезда. Отдельная плата не взимается, объект размещения при этом не предоставляется.",
      `После выезда: посещение бассейна в стоимость проживания не входит и оплачивается отдельно — ${money(poolPricing.afterCheckOut)} сум фиксированно за один день посещения.`,
      "Указанные условия действуют независимо от основного тарифа и в стоимость номера не включены.",
      "О намерении воспользоваться бассейном до заезда или после выезда необходимо заранее уведомить администрацию.",
    ],
    uz: [
      "Kirishdan oldin: tasdiqlangan broni bor mehmon joylashuvni kutayotib, hisob-kitob kirish vaqtigacha basseyndan foydalanishi mumkin. Alohida to'lov olinmaydi, joylashuv obyekti bu vaqtda berilmaydi.",
      `Chiqishdan keyin: basseynga tashrif yashash narxiga kirmaydi va alohida to'lanadi — bir kunlik tashrif uchun qat'iy ${money(poolPricing.afterCheckOut)} so'm.`,
      "Ushbu shartlar asosiy tarifdan qat'i nazar amal qiladi va xona narxiga kiritilmagan.",
      "Kirishdan oldin yoki chiqishdan keyin basseyndan foydalanish niyati haqida ma'muriyatni oldindan ogohlantirish kerak.",
    ],
    en: [
      "Before check-in: a guest with a confirmed booking may use the pool while waiting to be checked in, up to the stated check-in time. No separate charge applies; the cabin itself is not handed over at that point.",
      `After check-out: pool access is not part of the room rate and is paid separately — a flat ${money(poolPricing.afterCheckOut)} UZS for one day.`,
      "These conditions apply regardless of the main tariff and are not included in the room rate.",
      "Please notify the administration in advance if you intend to use the pool before check-in or after check-out.",
    ],
  },
};

/** Строка примечания, которую видит гость под изменённым пунктом. */
const MARK = (note: string) => `Примечание к пункту: ${note}`;

function amendItems(items: string[]): { items: string[]; changed: boolean } {
  let changed = false;
  const out: string[] = [];

  for (const item of items) {
    const hit = AMENDMENTS.find((a) => item.includes(a.from));
    if (!hit) {
      out.push(item);
      continue;
    }
    changed = true;
    out.push(item.replace(hit.from, hit.to));
    out.push(MARK(hit.note));
  }

  return { items: out, changed };
}

/** Применяет поправки к документу. Ничего не нашлось — документ возвращается как есть. */
export function amend(page: PolicyPage): PolicyPage {
  let touched = false;

  const sections = page.sections.map((section) => {
    // Тексты на всех трёх локалях одинаковы (документ русский), но проходим по
    // каждой: если появится перевод, поправка не должна применяться выборочно.
    const ru = amendItems(section.items.ru);
    const uz = amendItems(section.items.uz);
    const en = amendItems(section.items.en);
    touched ||= ru.changed || uz.changed || en.changed;
    return { ...section, items: { ru: ru.items, uz: uz.items, en: en.items } };
  });

  // Добавленные условия — только к оферте: в политике возврата и в политике
  // конфиденциальности разделу про бассейн делать нечего.
  if (page.slug === "public-offer") {
    return { ...page, sections: [...sections, poolAroundStaySection] };
  }

  return touched ? { ...page, sections } : page;
}

/** Сколько поправок объявлено — для теста, который следит за их актуальностью. */
export const amendmentCount = AMENDMENTS.length;
export const amendmentSources = AMENDMENTS.map((a) => a.from);
