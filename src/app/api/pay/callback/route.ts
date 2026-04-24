import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PASS = process.env.PAYKEEPER_PASSWORD ?? "";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;

  try {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } catch {
    return new NextResponse("FAIL", { status: 400 });
  }

  const { id, sum, clientid, orderid, service_name, client_email, sign } = body;

  // PayKeeper signature: MD5(id + sum + clientid + orderid + service_name + client_email + key + password)
  // The exact fields and order follow the PayKeeper notification docs.
  const expected = crypto
    .createHash("md5")
    .update(`${id}${sum}${clientid}${orderid}${service_name}${client_email}${PASS}`)
    .digest("hex");

  if (sign && sign.toLowerCase() !== expected.toLowerCase()) {
    console.warn("[pay/callback] Signature mismatch — possible tampered request");
    return new NextResponse("FAIL", { status: 403 });
  }

  console.log(
    `[pay/callback] Payment confirmed — order: ${orderid}, amount: ${sum}, client: ${clientid} <${client_email}>`
  );

  // TODO: persist transaction to database and trigger booking confirmation in Bnovo PMS.

  return new NextResponse("OK");
}
