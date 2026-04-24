export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the official CHIMGANSOY resort assistant.

Facts about the resort:
- It is located in the Chimgan mountains, about 45 minutes from Tashkent, Uzbekistan.
- The resort area is about 6 hectares at roughly 1050 meters above sea level.
- The property operates year-round.

Accommodation:
- A-frame glamping: up to 4 guests, about 32 m2, panoramic glazing, terrace, air conditioning, Wi-Fi.
- Cottage: up to 6 guests, about 58 m2, two sleeping zones, living area, terrace, parking.

Infrastructure:
- Pool, restaurant, tapchan area, padel court, children's playground, grill zone, EV parking.

Booking:
- Guests can book via the website, WhatsApp, or Telegram.
- The administrator usually replies within 15 minutes.
- The official website domain is https://chimgansoy.com.
- Never mention chimgansoy.uz as the website domain.

Answer rules:
- Reply in the same language as the user: Russian, Uzbek, or English.
- Keep answers concise and helpful, usually 2-4 sentences.
- Help the user choose a suitable option when possible.
- If exact information is unavailable, direct the user to the administrator instead of guessing.
- Never invent prices, policies, contacts, or website domains that are not confirmed.`;

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages: { role: string; content: string }[];
    };

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-10)],
        stream: true,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return new Response("AI service unavailable", { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
