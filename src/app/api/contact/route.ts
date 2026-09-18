import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveBrochureUrl, slugFromPath } from "@/lib/brochures";
import { saveContactSubmission, saveProductSubmission } from "@/lib/formSubmissions";

export const runtime = "nodejs";
export const maxDuration = 60;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Legacy JSONL backup — best effort alongside the database. */
async function persistJsonl(kind: string, payload: Record<string, unknown>): Promise<void> {
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
      // try next
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
  const city = asString(record.city);
  const products = asString(record.products) || asString(record.product);
  const kind = asString(record.kind) || "contact";
  const pageUrl = asString(record.page_url) || asString(record.productPath) || "";

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "Name and phone are required" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number" }, { status: 400 });
  }

  // Contact Us form (native): Name, Phone, City, Products — email optional
  if (kind === "contact") {
    if (!city) {
      return NextResponse.json({ ok: false, error: "City is required" }, { status: 400 });
    }
    if (!products) {
      return NextResponse.json({ ok: false, error: "Please select a product" }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
    }

    let id: string;
    let googleSheetsError: string | null = null;
    try {
      const saved = await saveContactSubmission({
        name,
        phone,
        city,
        products,
        email,
        message,
        pageUrl: pageUrl || "/contact-us/",
        details: record as Record<string, unknown>,
      });
      id = saved.id;
      googleSheetsError = saved.googleSheetsError;
    } catch (err) {
      console.error("[contact] database save failed", err);
      return NextResponse.json(
        { ok: false, error: "Unable to save your message. Please try again." },
        { status: 500 },
      );
    }

    await persistJsonl("contact", { id, name, email, phone, city, products, message, kind }).catch(
      (err) => console.error("[contact] jsonl backup failed", err),
    );

    // Sheets is durable on Vercel; skip local Excel/DB warnings when save succeeded.
    return NextResponse.json({
      ok: true,
      id,
      ...(googleSheetsError ? { googleSheetsWarning: googleSheetsError } : {}),
    });
  }

  // Brochure / product lead forms require email
  if (!email) {
    return NextResponse.json({ ok: false, error: "Name, phone and email are required" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  const productPath = asString(record.productPath) || pageUrl;
  const product = asString(record.product) || slugFromPath(productPath);

  let id: string;
  let googleSheetsError: string | null = null;
  try {
    const saved = await saveProductSubmission({
      name,
      email,
      phone,
      message,
      product,
      productPath,
      pageUrl: productPath,
      details: record as Record<string, unknown>,
    });
    id = saved.id;
    googleSheetsError = saved.googleSheetsError;
  } catch (err) {
    console.error("[product] database save failed", err);
    return NextResponse.json(
      { ok: false, error: "Unable to save your request. Please try again." },
      { status: 500 },
    );
  }

  await persistJsonl(kind === "brochure" ? "brochure" : "contact", {
    id,
    name,
    email,
    phone,
    message,
    kind,
    product,
    productPath,
  }).catch((err) => console.error("[product] jsonl backup failed", err));

  if (kind === "brochure") {
    const downloadUrl = resolveBrochureUrl(productPath || product);
    return NextResponse.json({
      ok: true,
      id,
      downloadUrl,
      ...(googleSheetsError ? { googleSheetsWarning: googleSheetsError } : {}),
    });
  }

  return NextResponse.json({
    ok: true,
    id,
    ...(googleSheetsError ? { googleSheetsWarning: googleSheetsError } : {}),
  });
}
