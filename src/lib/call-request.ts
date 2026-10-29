import { contacts } from "@/content/contacts";

/**
 * «Позвоните» — боту, который звонить не умеет.
 *
 * 23.10.2026 в группе заявок сотрудник ответил на уведомление о новой заявке
 * «@ChimganDarbaza позвоните». Ответ на сообщение бота бот считает вопросом к
 * себе, отдал его ИИ, и тот написал «Конечно, позвоню вам!». Звонка не было бы:
 * бот звонить не может, а сотрудник решил бы, что гостю уже позвонили.
 *
 * Поэтому просьба позвонить ловится до ИИ и получает один и тот же честный
 * ответ, а не то, что модель придумает в этот раз.
 *
 * Ловятся только повелительные формы: «позвоните», «перезвони», «наберите».
 * «Позвонил на ресепшен» и «куда позвонить?» — не просьба к боту, их разбирает ИИ.
 */
const CALL_REQUEST = [
  /(?<![а-яё])(пере|по)звони(те)?(?![а-яё])/i,
  /(?<![а-яё])наберите(?![а-яё])/i,
  /qo['‘’`ʻ]?ng['‘’`ʻ]?iroq\s+qil(ing|ib|sangiz)/i,
  /telefon\s+qiling/i,
  /\b(call|ring)\s+(me|us|back|him|her|them|the guest)\b/i,
  /\b(please|pls)\s+call\b/i,
  /\bgive\s+(me|us|him|her|them)\s+a\s+call\b/i,
];

export function isCallRequest(text: string): boolean {
  return CALL_REQUEST.some((re) => re.test(text));
}

/** Язык ответа — по письму последнего сообщения, как и у ИИ. */
function langOf(text: string): "ru" | "uz" | "en" {
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[og]['‘’`ʻ]|qo.?ng.?iroq|qiling|\b(salom|rahmat|iltimos|kerak)\b/i.test(text)) return "uz";
  if (/[A-Za-z]/.test(text)) return "en";
  return "ru";
}

/** Что бот отвечает на просьбу позвонить. Номер — тот же, что везде на сайте. */
export function cannotCallReply(text: string): string {
  const phone = contacts.phone;
  return {
    ru: `Я бот и звонить не могу. Если есть вопросы — позвоните по номеру ${phone}.`,
    uz: `Men botman, qo'ng'iroq qila olmayman. Savollar bo'lsa — ${phone} raqamiga qo'ng'iroq qiling.`,
    en: `I'm a bot and can't make calls. If you have any questions, please call ${phone}.`,
  }[langOf(text)];
}
