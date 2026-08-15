"use server";

import { contacts } from "@/content/contacts";
import { esc } from "@/lib/telegram";
import { deliverRequest, dialable, todayTashkent } from "@/lib/request-delivery";
import { readOverrides, type FormField } from "@/lib/site-overrides";
import { insertServiceRequest } from "@/lib/db";
import { validateLegalConsents } from "@/lib/legal-consent";

export type ServiceRequestState = { ok?: boolean; error?: string };

/**
 * Заявка по услуге, форму которой оператор собрал в панели.
 *
 * Набор полей берётся из хранилища, а НЕ из присланной формы: иначе кто угодно
 * мог бы прислать свой список полей и обойти обязательность и границы чисел.
 * Проверка на клиенте нужна гостю, эта — сайту.
 *
 * Заявка ложится в архив как «вопрос» (inquiry) с указанием услуги и ответами.
 * Отдельный тип не заводится намеренно: `RequestService` читают бот, сводка и
 * подсчёты, и новое значение пришлось бы учесть в каждом — а любая пропущенная
 * ветка означает заявку, которой оператор не увидит.
 */
const MESSAGES = {
  ru: {
    nameRequired: "Укажите имя",
    phoneRequired: "Укажите номер телефона",
    phoneInvalid: "Проверьте номер телефона",
    required: (label: string) => `Заполните поле «${label}»`,
    range: (label: string, min: number, max: number) => `«${label}»: допустимо от ${min} до ${max}`,
    datePast: "Дата уже прошла — выберите другую",
    unknown: "Услуга больше не доступна",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
  },
  uz: {
    nameRequired: "Ismingizni kiriting",
    phoneRequired: "Telefon raqamingizni kiriting",
    phoneInvalid: "Telefon raqamini tekshiring",
    required: (label: string) => `«${label}» maydonini to'ldiring`,
    range: (label: string, min: number, max: number) => `«${label}»: ${min} dan ${max} gacha`,
    datePast: "Bu sana o'tib ketgan — boshqasini tanlang",
    unknown: "Bu xizmat endi mavjud emas",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
  },
  en: {
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter your phone number",
    phoneInvalid: "Please check your phone number",
    required: (label: string) => `Please fill in “${label}”`,
    range: (label: string, min: number, max: number) => `“${label}”: between ${min} and ${max}`,
    datePast: "That date has passed — please pick another",
    unknown: "This service is no longer available",
    failed: `Could not send the request. Please call us: ${contacts.phone}`,
  },
} as const;

type Lang = keyof typeof MESSAGES;
const langOf = (raw: string): Lang => (raw === "uz" || raw === "en" ? raw : "ru");

/** Ответ гостя на одно поле, уже проверенный. */
type Answer = { label: string; value: string };

function readField(f: FormField, form: FormData, t: (typeof MESSAGES)[Lang]): Answer | { error: string } | null {
  const raw = form.get(`f:${f.key}`);

  if (f.type === "checkbox") {
    const on = raw === "on" || raw === "true";
    // Невыбранную галочку в заявку не пишем: строка «Нет» в списке ответов
    // читается хуже, чем её отсутствие.
    return on ? { label: f.label, value: "да" } : null;
  }

  const value = String(raw ?? "").trim().slice(0, 500);
  if (!value) {
    return f.required ? { error: t.required(f.label) } : null;
  }

  if (f.type === "number") {
    const n = Number(value);
    const min = f.min ?? 0;
    const max = f.max ?? 999;
    if (!Number.isFinite(n) || n < min || n > max) return { error: t.range(f.label, min, max) };
    return { label: f.label, value: String(Math.round(n)) };
  }

  if (f.type === "date" && value < todayTashkent()) {
    return { error: t.datePast };
  }

  // Вариант, которого нет в списке, — это подделанная форма, а не опечатка.
  if (f.type === "select" && f.options && !f.options.includes(value)) {
    return { error: t.required(f.label) };
  }

  return { label: f.label, value };
}

export async function submitServiceRequest(
  _prev: ServiceRequestState,
  form: FormData,
): Promise<ServiceRequestState> {
  const locale = langOf(String(form.get("locale") ?? "ru"));
  const t = MESSAGES[locale];

  // Ловушка для ботов: заполненное поле — не человек. Отвечаем успехом, чтобы
  // не подсказывать, на чём его поймали.
  if (String(form.get("company") ?? "").trim()) return { ok: true };

  const legalError = validateLegalConsents(form, locale);
  if (legalError) return { error: legalError };

  const slug = String(form.get("slug") ?? "").trim();
  const service = (await readOverrides()).customServices.find((c) => c.slug === slug && !c.hidden);
  if (!service) return { error: t.unknown };

  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const phoneRaw = String(form.get("phone") ?? "").trim().slice(0, 40);
  if (!name) return { error: t.nameRequired };
  if (!phoneRaw) return { error: t.phoneRequired };
  const phone = dialable(phoneRaw);
  // Узбекский номер — 12 цифр с кодом страны; принимаем и без него.
  if (phone.replace(/\D/g, "").length < 9) return { error: t.phoneInvalid };

  const answers: Answer[] = [];
  for (const f of service.formFields ?? []) {
    const got = readField(f, form, t);
    if (got && "error" in got) return { error: got.error };
    if (got) answers.push(got);
  }

  // Дата визита, если оператор её спросил, — по ней заявка ложится в архив.
  const dateField = (service.formFields ?? []).find((f) => f.type === "date");
  const visitDate = dateField ? String(form.get(`f:${dateField.key}`) ?? "").trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(visitDate) ? visitDate : todayTashkent();

  const title = service.title;
  const lines = [
    `💬 <b>Заявка: ${esc(title)}</b>`,
    "",
    `Имя: ${esc(name)}`,
    `Телефон: ${esc(phone)}`,
    ...answers.map((a) => `${esc(a.label)}: ${esc(a.value)}`),
    "",
    `Язык страницы: ${locale}`,
  ];

  const rows = answers.map((a) => `<tr><td>${esc(a.label)}</td><td>${esc(a.value)}</td></tr>`).join("");

  try {
    await deliverRequest({
      telegramHtml: lines.join("\n"),
      emailSubject: `Заявка: ${title} — ${name}`,
      emailHtml: `<h2>Заявка: ${esc(title)}</h2><table><tr><td>Имя</td><td>${esc(name)}</td></tr><tr><td>Телефон</td><td>${esc(phone)}</td></tr>${rows}</table>`,
      record: {
        // «Вопрос», а не новый тип: см. комментарий в начале файла.
        service: "inquiry",
        date,
        name,
        phone,
        adults: 0,
        kids: 0,
        toddlers: 0,
        // Ответы едут в архив как «услуга: поле — значение», чтобы заявку можно
        // было прочитать, даже если форму потом переделают или услугу удалят.
        extras: [title, ...answers.map((a) => `${a.label}: ${a.value}`)],
        total: 0,
        tariff: title,
        locale,
      },
    });
  } catch (e) {
    console.error("[service-request] delivery failed:", e);
    return { error: t.failed };
  }

  // Как и у броней: запись в базу не может стоить гостю заявки.
  await insertServiceRequest({
    serviceSlug: slug,
    serviceName: title,
    visitDate: dateField ? date : undefined,
    guestName: name,
    phone,
    answers: Object.fromEntries(answers.map((x) => [x.label, x.value])),
    locale,
  });

  return { ok: true };
}
