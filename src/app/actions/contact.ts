"use server";

export type ContactResult = { ok: true } | { ok: false; error: string };

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // Telegram notification is best-effort — don't fail the form
  }
}

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name) return { ok: false, error: "Укажите имя" };
  if (!phone) return { ok: false, error: "Укажите номер телефона" };

  const msg = [
    `📩 <b>Новая заявка — CHIMGANSOY</b>`,
    ``,
    `👤 <b>Имя:</b> ${name}`,
    `📞 <b>Телефон:</b> ${phone}`,
    message ? `💬 <b>Сообщение:</b> ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegram(msg);

  console.log(`[contact] New inquiry — name: ${name}, phone: ${phone}, message: ${message || "—"}`);

  return { ok: true };
}
