import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const name = asString(record.name);
  const email = asString(record.email);
  const phone = asString(record.phone);
  const message = asString(record.message);
  const kind = asString(record.kind) || "contact";
  if (!name || !phone || !email) {
    return NextResponse.json({ ok: false, error: "Name, phone and email are required" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number" }, { status: 400 });
  }

  const dir = join(process.cwd(), "data", "submissions");
  await mkdir(dir, { recursive: true });
  await appendFile(
    join(dir, `${kind}.jsonl`),
    `${JSON.stringify({ ...record, name, email, phone, message, at: new Date().toISOString() })}\n`,
    "utf8",
  );

  return NextResponse.json({ ok: true });
}
