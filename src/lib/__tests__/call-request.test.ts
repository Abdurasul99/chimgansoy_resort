import { describe, expect, it } from "vitest";
import { cannotCallReply, isCallRequest } from "../call-request";
import { contacts } from "@/content/contacts";

describe("просьба позвонить — бот не обещает звонок", () => {
  it("ловит фразу из группы заявок 23.10.2026", () => {
    expect(isCallRequest("@ChimganDarbaza позвоните")).toBe(true);
  });

  for (const text of [
    "Позвоните мне, пожалуйста",
    "перезвоните",
    "позвони гостю",
    "Наберите меня",
    "Iltimos, qo'ng'iroq qiling",
    "menga qo‘ng‘iroq qilib yuboring",
    "telefon qiling",
    "Please call me",
    "can you call back?",
    "give me a call",
  ]) {
    it(`просьба: «${text}»`, () => expect(isCallRequest(text)).toBe(true));
  }

  for (const text of [
    "Куда позвонить?",
    "Я позвонил на ресепшен",
    "Сколько стоит шале на субботу?",
    "Можно с собакой?",
    "Shale narxi qancha?",
    "What time is check-in?",
    "Is there a call center?",
  ]) {
    it(`не просьба: «${text}»`, () => expect(isCallRequest(text)).toBe(false));
  }

  it("отвечает на языке сообщения и даёт номер", () => {
    const ru = cannotCallReply("@ChimganDarbaza позвоните");
    expect(ru).toContain("звонить не могу");
    expect(ru).toContain(contacts.phone);
    expect(cannotCallReply("qo'ng'iroq qiling")).toContain("qo'ng'iroq qila olmayman");
    expect(cannotCallReply("please call me")).toContain("can't make calls");
    for (const t of ["позвоните", "qo'ng'iroq qiling", "call me"]) {
      expect(cannotCallReply(t)).toContain(contacts.phone);
      expect(cannotCallReply(t)).not.toMatch(/позвоню|перезвоню/i);
    }
  });
});
