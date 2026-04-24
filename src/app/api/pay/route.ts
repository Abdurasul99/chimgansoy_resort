import { NextRequest, NextResponse } from "next/server";

const SERVER = process.env.PAYKEEPER_SERVER?.replace(/\/$/, "");
const USER = process.env.PAYKEEPER_USER;
const PASS = process.env.PAYKEEPER_PASSWORD;

function missingConfig() {
  return NextResponse.json(
    { error: "PayKeeper not configured. Set PAYKEEPER_SERVER, PAYKEEPER_USER, PAYKEEPER_PASSWORD in .env." },
    { status: 501 }
  );
}

async function getToken(): Promise<string> {
  const res = await fetch(`${SERVER}/info/settings/token/`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64"),
    },
  });
  if (!res.ok) throw new Error(`PayKeeper token fetch failed: ${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

export async function POST(req: NextRequest) {
  if (!SERVER || !USER || !PASS) return missingConfig();

  let body: {
    amount: number;
    orderDescription?: string;
    clientEmail?: string;
    checkin?: string;
    checkout?: string;
    guestName?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, orderDescription, clientEmail, checkin, checkout, guestName } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  try {
    const token = await getToken();

    const params = new URLSearchParams({
      pay_amount: String(amount),
      clientid: guestName ?? "Guest",
      orderid: `CHIM-${Date.now()}`,
      service_name: orderDescription ?? `CHIMGANSOY — ${checkin ?? ""} / ${checkout ?? ""}`,
      client_email: clientEmail ?? "",
      token,
    });

    const invoiceRes = await fetch(`${SERVER}/change/invoice/preview/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64"),
      },
      body: params.toString(),
    });

    if (!invoiceRes.ok) {
      const text = await invoiceRes.text();
      console.error("[pay] PayKeeper invoice error:", text);
      return NextResponse.json({ error: "PayKeeper invoice creation failed" }, { status: 502 });
    }

    const invoice = await invoiceRes.json() as { invoice_id?: string; pay_url?: string };
    const paymentUrl = invoice.pay_url ?? `${SERVER}/pay/${invoice.invoice_id}/`;

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[pay] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
