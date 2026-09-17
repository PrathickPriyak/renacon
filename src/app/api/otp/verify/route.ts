import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

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
  const otp = asString(record.otp);
  const demoChallenge = asString(record.demoChallenge) || undefined;
  if (!phone || !otp) {
    return NextResponse.json({ ok: false, error: "Phone and OTP are required" }, { status: 400 });
  }

  const result = await verifyOtp(phone, otp, demoChallenge);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
