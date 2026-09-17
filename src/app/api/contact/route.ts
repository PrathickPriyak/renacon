import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveBrochureUrl, slugFromPath } from "@/lib/brochures";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Persist locally when possible; on Vercel use /tmp (ephemeral) and always return success after validation. */
async function persistSubmission(kind: string, payload: Record<string, unknown>): Promise<void> {
  const line = `${JSON.stringify({ ...payload, at: new Date().toISOString() })}\n`;
  const candidates = [
    join(process.cwd(), "data", "submissions"),
    join(tmpdir(), "renacon-submissions"),
  ];

  for (const dir of candidates) {
    try {
      await mkdir(dir, { recursive: true });
      await appendFile(join(dir, `${kind}.jsonl`), line, "utf8");
      return;
    } catch {
      // try next location (read-only FS on some hosts)
    }
  }

  console.info("[submission]", kind, line.trim());
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

  await persistSubmission(kind, {
    ...record,
    name,
    email,
    phone,
    message,
    kind,
  });

  if (kind === "brochure") {
    const productPath = asString(record.productPath) || asString(record.page_url) || "";
    const downloadUrl = resolveBrochureUrl(productPath || slugFromPath(asString(record.product)));
    return NextResponse.json({ ok: true, downloadUrl });
  }

  return NextResponse.json({ ok: true });
}
