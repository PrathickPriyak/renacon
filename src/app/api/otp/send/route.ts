import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const phone = asString(record.phone);
  const name = asString(record.name) || undefined;
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Phone number is required" }, { status: 400 });
  }

  const result = await sendOtp(phone, name);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
