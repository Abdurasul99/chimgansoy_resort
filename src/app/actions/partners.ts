"use server";

import { partnersPage } from "@/content/partners";
import { saveRequest } from "@/lib/requests-store";
import { adminChatIds } from "@/lib/request-delivery";
import { esc, sendMessage } from "@/lib/telegram";
import { pageLine, trafficSource } from "@/lib/request-context";
import { escapeHtml, sendEmail } from "@/lib/send-email";

export type PartnerResult = { ok: true } | { ok: false; error: string };

const MESSAGES = {
  ru: {
    org: "Укажите компанию",
    name: "Укажите имя",
    contact: "Оставьте телефон или рабочую почту",
    phone: "Проверьте номер телефона",
    email: "Проверьте адрес почты",
    privacy: "Нужно согласие на обработку персональных данных",
    failed: "Не удалось отправить заявку. Позвоните нам: +998 70 176 00 11",
  },
  uz: {
    org: "Kompaniyani kiriting",
    name: "Ismingizni kiriting",
    contact: "Telefon yoki ish pochtasini qoldiring",
    phone: "Telefon raqamini tekshiring",
    email: "Pochta manzilini tekshiring",
    privacy: "Shaxsiy ma'lumotlarni qayta ishlashga rozilik kerak",
    failed: "Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: +998 70 176 00 11",
  },
  en: {
    org: "Please enter your company",
    name: "Please enter your name",
    contact: "Leave a phone number or a work email",
    phone: "Please check your phone number",
    email: "Please check your email address",
    privacy: "Consent to personal data processing is required",
    failed: "We couldn't send your request. Please call us: +998 70 176 00 11",
  },
} as const;

/**
 * Заявка «🤝 Партнёрство» со страницы /partners.
 *
 * Отдельно от submitContact: у компании нет дат и гостей, зато есть название и
 * интересующая программа, а согласие с публичной офертой для гостей сюда не
 * относится — только на обработку персональных данных. Путь доставки тот же:
 * Telegram-группа, почта info@ и журнал заявок (как «вопрос», с пометкой).
 */
export async function submitPartnerRequest(formData: FormData): Promise<PartnerResult> {
  // Ловушка для ботов: поле, которое человек не видит и не заполняет.
  if (((formData.get("company") as string | null) ?? "").trim()) return { ok: true };

  const field = (key: string, max: number) => ((formData.get(key) as string | null) ?? "").trim().slice(0, max);
  const localeRaw = field("locale", 4);
  const lang = localeRaw === "uz" || localeRaw === "en" ? localeRaw : "ru";
  const m = MESSAGES[lang];

  const org = field("org", 120);
  const name = field("name", 80);
  const phone = field("phone", 40);
  const email = field("email", 120);
  const message = field("message", 2000);
  const programId = field("program", 40);

  if (!org) return { ok: false, error: m.org };
  if (!name) return { ok: false, error: m.name };
  if (!phone && !email) return { ok: false, error: m.contact };
  if (phone && phone.replace(/\D/g, "").length < 7) return { ok: false, error: m.phone };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: m.email };
  if (formData.get("privacyConsent") !== "on") return { ok: false, error: m.privacy };

  // Программа — только из списка: в сообщение группе идёт её название, а не
  // присланная строка.
  const program = partnersPage.programs.items.find((p) => p.id === programId)?.title.ru ?? (programId ? "Своя идея" : "");
  const page = pageLine(formData);
  const source = trafficSource(formData);

  const rows: Array<[string, string]> = [
    ["Компания", org],
    ["Имя", name],
    ...(phone ? [["Телефон", phone] as [string, string]] : []),
    ...(email ? [["Почта", email] as [string, string]] : []),
    ...(program ? [["Интересует", program] as [string, string]] : []),
    ...(message ? [["Задача", message] as [string, string]] : []),
    ...(page ? [["Страница", page] as [string, string]] : []),
    ...(source ? [["Пришёл из", source] as [string, string]] : []),
  ];

  const telegramHtml = [
    "🤝 <b>Партнёрство</b>",
    "",
    ...rows.map(([k, v]) => `${k}: ${esc(v)}`),
    `Язык страницы: ${lang}`,
  ].join("\n");

  const emailHtml = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a2418;">
  <div style="background:#1a4d2e;color:white;padding:24px 28px;border-radius:12px 12px 0 0;">
    <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;">CHIMGAN DARBAZA RESORT</p>
    <h1 style="margin:6px 0 0;font-size:22px;font-weight:600;">Заявка на партнёрство</h1>
  </div>
  <div style="background:#fafaf7;padding:8px 28px 24px;border:1px solid #e8e6df;border-top:none;border-radius:0 0 12px 12px;">
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ece9e0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7a73;width:35%;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ece9e0;font-size:14px;color:#1a2418;font-weight:500;">${escapeHtml(v).replaceAll("\n", "<br>")}</td>
        </tr>`,
        )
        .join("")}
    </table>
  </div>
</div>`.trim();

  const [emailStatus, sent] = await Promise.all([
    sendEmail(`Партнёрство: ${org}`, emailHtml, process.env.INFO_EMAIL_TO ?? process.env.BOOKING_EMAIL_TO, email || undefined),
    Promise.all(adminChatIds().map((id) => sendMessage(id, telegramHtml))),
    saveRequest({
      service: "inquiry",
      date: new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10),
      name,
      phone: phone || email,
      email: email || undefined,
      adults: 0,
      kids: 0,
      toddlers: 0,
      extras: [`Партнёрство: ${org}`, ...(program ? [`Интересует: ${program}`] : []), ...(page ? [`Страница: ${page}`] : [])],
      total: 0,
      tariff: "",
      message: message || undefined,
      locale: lang,
    }).catch((e) => {
      console.error("[partners] archive failed:", e);
      return null;
    }),
  ]);

  const delivered = emailStatus === "sent" || sent.some((r) => r !== null);
  console.log(`[partners] email=${emailStatus} telegram=${sent.filter((r) => r !== null).length} | ${org}, ${name}`);
  return delivered ? { ok: true } : { ok: false, error: m.failed };
}
