"use server";

import { contacts } from "@/content/contacts";
import { rooms } from "@/content/rooms";
import { esc } from "@/lib/telegram";
import { text } from "@/lib/localize";
import { deliverRequest, dialable, todayTashkent } from "@/lib/request-delivery";

export type StayRequestState = { ok?: boolean; error?: string };

/**
 * Заявка на проживание — глэмпинг или шале.
 *
 * Раньше кнопка на карточке вела в движок Exely: гость попадал в чужой
 * интерфейс, где нужно разобраться с тарифами и заполнить длинную форму. Здесь
 * он оставляет заявку в четыре поля, а дальше с ним говорит человек — тот же
 * путь, что уже работает у бассейна, топчана и тюбинга.
 *
 * В архив ложится как «booking»: этот тип в RequestService уже есть, его читают
 * бот и сводка, и новых веток заводить не нужно.
 */
const MESSAGES = {
  ru: {
    nameRequired: "Укажите имя",
    phoneRequired: "Укажите номер телефона",
    phoneInvalid: "Проверьте номер телефона",
    dateRequired: "Выберите дату заезда",
    datePast: "Дата заезда уже прошла — выберите другую",
    orderWrong: "Выезд должен быть позже заезда",
    guestsWrong: "Укажите хотя бы одного гостя",
    emailInvalid: "Проверьте адрес почты",
    unknown: "Домик больше не доступен",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
  },
  uz: {
    nameRequired: "Ismingizni kiriting",
    phoneRequired: "Telefon raqamingizni kiriting",
    phoneInvalid: "Telefon raqamini tekshiring",
    dateRequired: "Kirish sanasini tanlang",
    datePast: "Bu sana o'tib ketgan — boshqasini tanlang",
    orderWrong: "Chiqish sanasi kirishdan keyin bo'lishi kerak",
    guestsWrong: "Kamida bitta mehmonni ko'rsating",
    emailInvalid: "Pochta manzilini tekshiring",
    unknown: "Bu uycha endi mavjud emas",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
  },
  en: {
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter your phone number",
    phoneInvalid: "Please check your phone number",
    dateRequired: "Please pick an arrival date",
    datePast: "That date has passed — please pick another",
    orderWrong: "Check-out must be after check-in",
    guestsWrong: "Please add at least one guest",
    emailInvalid: "Please check the email address",
    unknown: "This cabin is no longer available",
    failed: `Could not send the request. Please call us: ${contacts.phone}`,
  },
} as const;

type Lang = keyof typeof MESSAGES;
const langOf = (raw: string): Lang => (raw === "uz" || raw === "en" ? raw : "ru");

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const num = (form: FormData, key: string) => {
  const n = Number(String(form.get(key) ?? "").trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

export async function submitStayRequest(
  _prev: StayRequestState,
  form: FormData,
): Promise<StayRequestState> {
  const locale = langOf(String(form.get("locale") ?? "ru"));
  const t = MESSAGES[locale];

  // Ловушка для ботов: человек это поле не видит. Отвечаем успехом, чтобы не
  // подсказывать, на чём его поймали.
  if (String(form.get("company") ?? "").trim()) return { ok: true };

  const slug = String(form.get("room") ?? "").trim();
  const room = rooms.find((r) => r.slug === slug);
  if (!room) return { error: t.unknown };

  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const phoneRaw = String(form.get("phone") ?? "").trim().slice(0, 40);
  const email = String(form.get("email") ?? "").trim().slice(0, 160);
  const comment = String(form.get("comment") ?? "").trim().slice(0, 600);
  const checkin = String(form.get("checkin") ?? "").trim();
  const checkout = String(form.get("checkout") ?? "").trim();
  const adults = num(form, "adults");
  const kids = num(form, "kids");

  if (!name) return { error: t.nameRequired };
  if (!phoneRaw) return { error: t.phoneRequired };
  const phone = dialable(phoneRaw);
  if (phone.replace(/\D/g, "").length < 9) return { error: t.phoneInvalid };
  // Почта необязательна, но если её написали — она должна быть похожа на почту.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.emailInvalid };
  if (!ISO.test(checkin)) return { error: t.dateRequired };
  if (checkin < todayTashkent()) return { error: t.datePast };
  // Даты в ISO сравниваются строками корректно.
  if (checkout && (!ISO.test(checkout) || checkout <= checkin)) return { error: t.orderWrong };
  if (adults + kids < 1) return { error: t.guestsWrong };

  const title = text(room.title, "ru");
  const nights = checkout
    ? Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86_400_000)
    : 0;

  const lines = [
    `🏡 <b>Заявка на проживание: ${esc(title)}</b>`,
    "",
    `Имя: ${esc(name)}`,
    `Телефон: ${esc(phone)}`,
    ...(email ? [`Почта: ${esc(email)}`] : []),
    `Заезд: ${esc(checkin)}`,
    ...(checkout ? [`Выезд: ${esc(checkout)}${nights > 0 ? ` (${nights} ноч.)` : ""}`] : []),
    `Гостей: ${adults} взр.${kids > 0 ? ` + ${kids} дет.` : ""}`,
    ...(comment ? ["", `Комментарий: ${esc(comment)}`] : []),
    "",
    `Язык страницы: ${locale}`,
  ];

  try {
    await deliverRequest({
      telegramHtml: lines.join("\n"),
      emailSubject: `Заявка на проживание: ${title} — ${name}`,
      emailHtml:
        `<h2>Заявка на проживание: ${esc(title)}</h2><table>` +
        `<tr><td>Имя</td><td>${esc(name)}</td></tr>` +
        `<tr><td>Телефон</td><td>${esc(phone)}</td></tr>` +
        (email ? `<tr><td>Почта</td><td>${esc(email)}</td></tr>` : "") +
        `<tr><td>Заезд</td><td>${esc(checkin)}</td></tr>` +
        (checkout ? `<tr><td>Выезд</td><td>${esc(checkout)}</td></tr>` : "") +
        `<tr><td>Гостей</td><td>${adults} взр. + ${kids} дет.</td></tr>` +
        (comment ? `<tr><td>Комментарий</td><td>${esc(comment)}</td></tr>` : "") +
        `</table>`,
      record: {
        service: "booking",
        // Архив раскладывает заявки по дате визита — для проживания это заезд.
        date: checkin,
        name,
        phone,
        adults,
        kids,
        toddlers: 0,
        extras: [
          title,
          ...(checkout ? [`Выезд: ${checkout}`] : []),
          ...(email ? [`Почта: ${email}`] : []),
          ...(comment ? [`Комментарий: ${comment}`] : []),
        ],
        total: 0,
        tariff: title,
        locale,
      },
    });
  } catch (e) {
    console.error("[stay-request] delivery failed:", e);
    return { error: t.failed };
  }

  return { ok: true };
}
