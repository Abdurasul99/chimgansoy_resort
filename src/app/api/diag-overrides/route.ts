import { NextResponse } from "next/server";
import { readForEdit, readOverrides } from "@/lib/site-overrides";

/**
 * Временный диагностический маршрут: что видит публичная (кешированная) чтение
 * и что видит админка. Никаких секретов — только флаги услуг. Удалить сразу
 * после проверки.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const cached = await readOverrides();
  const fresh = await readForEdit();
  return NextResponse.json({
    cached: cached.services,
    fresh: fresh.services,
    tokenSet: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
