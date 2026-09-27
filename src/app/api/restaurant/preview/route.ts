import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_TTL_S, PREVIEW_COOKIE, signPreview, verifyPreview } from "@/lib/restaurant/preview";

export const dynamic = "force-dynamic";

/**
 * Вход в предпросмотр ресторана по ссылке из панели и выход из него.
 *
 * Ссылка подписана и живёт два часа; по ней сайт ставит свою cookie на сутки.
 * Подделать ссылку без AUTH_SECRET нельзя, а неверная просто ведёт на сайт —
 * без объяснений, что здесь могло бы быть.
 *
 * Редирект — относительный. Сайт работает за nginx, и у запроса к обработчику
 * адрес внутренний (localhost:3000): абсолютный адрес из него увёл бы
 * владельца на localhost вместо chimgandarbaza.uz.
 */
function go(path: string): NextResponse {
  const res = new NextResponse(null, { status: 303, headers: { Location: path } });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const locale = ["ru", "uz", "en"].includes(params.get("l") ?? "") ? params.get("l")! : "ru";

  if (params.get("off") === "1") {
    const res = go(`/${locale}/restaurant`);
    res.cookies.delete(PREVIEW_COOKIE);
    return res;
  }

  if (!verifyPreview(params.get("t") ?? "", "link")) return go(`/${locale}`);

  // Своя подпись на сутки, а не присланная: у ссылки срок короче.
  const cookie = signPreview(Date.now() + COOKIE_TTL_S * 1000, "cookie");
  const res = go(`/${locale}/restaurant`);
  if (cookie) {
    res.cookies.set(PREVIEW_COOKIE, cookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_TTL_S,
    });
  }
  return res;
}
