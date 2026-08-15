import { NextResponse } from "next/server";
import { listRooms, searchBookingNumbers } from "@/lib/exely-pms";

/** Временная диагностика связи с PMS Exely. Без гостевых данных. Удалить. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const rooms = await listRooms();
  const numbers = await searchBookingNumbers(from, to);

  return NextResponse.json({
    keySet: Boolean(process.env.EXELY_API_KEY?.trim()),
    base: process.env.EXELY_API_BASE?.trim() || "(по умолчанию)",
    rooms: rooms.ok ? rooms.data.length : `ошибка: ${rooms.error}`,
    roomSample: rooms.ok ? rooms.data.slice(0, 3).map((r) => `${r.id}:${r.name ?? ""}`) : [],
    bookings: numbers.ok ? numbers.data.length : `ошибка: ${numbers.error}`,
  });
}
