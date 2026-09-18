import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveBrochureUrl, slugFromPath } from "@/lib/brochures";
import { saveContactSubmission, saveProductSubmission } from "@/lib/formSubmissions";
import {
  assertSameOrigin,
  clientIp,
  clip,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;

const FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  message: 5000,
  city: 120,
  products: 200,
  product: 200,
  productPath: 500,
  pageUrl: 500,
};

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
  const originDenied = assertSameOrigin(request);
  if (originDenied) return originDenied;

  const limited = rateLimit(`contact:${clientIp(request)}`, 8, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

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
  const name = clip(asString(record.name), FIELD_LIMITS.name);
  const email = clip(asString(record.email), FIELD_LIMITS.email);
  const phone = clip(asString(record.phone), FIELD_LIMITS.phone);
  const message = clip(asString(record.message), FIELD_LIMITS.message);
  const city = clip(asString(record.city), FIELD_LIMITS.city);
  const products =
    clip(asString(record.products), FIELD_LIMITS.products) ||
    clip(asString(record.product), FIELD_LIMITS.product);
  const kind = clip(asString(record.kind) || "contact", 40);
  const pageUrl = clip(
    asString(record.page_url) || asString(record.productPath) || "",
    FIELD_LIMITS.pageUrl,
  );

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
    try {
      const saved = await saveContactSubmission({
        name,
        phone,
        city,
        products,
        email,
        message,
        pageUrl: pageUrl || "/contact-us/",
        details: {
          name,
          phone,
          city,
          products,
          email,
          message,
          kind,
          page_url: pageUrl || "/contact-us/",
        },
      });
      id = saved.id;
      if (saved.excelError) console.error("[contact] excel", saved.excelError);
      if (saved.googleSheetsError) console.error("[contact] sheets", saved.googleSheetsError);
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

    return NextResponse.json({ ok: true, id });
  }

  // Brochure / product lead forms require email
  if (!email) {
    return NextResponse.json({ ok: false, error: "Name, phone and email are required" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  const productPath = clip(
    asString(record.productPath) || pageUrl,
    FIELD_LIMITS.productPath,
  );
  const product = clip(asString(record.product) || slugFromPath(productPath), FIELD_LIMITS.product);

  let id: string;
  try {
    const saved = await saveProductSubmission({
      name,
      email,
      phone,
      message,
      product,
      productPath,
      pageUrl: productPath,
      details: {
        name,
        email,
        phone,
        message,
        product,
        productPath,
        kind,
      },
    });
    id = saved.id;
    if (saved.excelError) console.error("[product] excel", saved.excelError);
    if (saved.googleSheetsError) console.error("[product] sheets", saved.googleSheetsError);
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
    return NextResponse.json({ ok: true, id, downloadUrl });
  }

  return NextResponse.json({ ok: true, id });
}
