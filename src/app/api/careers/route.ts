import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  storePhotoFile,
  storeResumeFile,
  validatePhotoFile,
  validateResumeFile,
  type ResumeMeta,
} from "@/lib/resumes";
import { saveCareerSubmission } from "@/lib/formSubmissions";
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
  role: 120,
  experience: 120,
  location: 120,
  qualification: 200,
  page_url: 500,
  product: 200,
  detailsJson: 8000,
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Legacy JSONL backup — best effort alongside the database. */
async function persistCareersJsonl(payload: Record<string, unknown>): Promise<void> {
  const line = `${JSON.stringify({ ...payload, at: new Date().toISOString() })}\n`;
  const candidates = [
    join(process.cwd(), "data", "submissions"),
    join(tmpdir(), "renacon-submissions"),
  ];

  for (const dir of candidates) {
    try {
      await mkdir(dir, { recursive: true });
      await appendFile(join(dir, "careers.jsonl"), line, "utf8");
      return;
    } catch {
      // try next
    }
  }
  console.info("[submission]", "careers", line.trim());
}

type CareersFields = {
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  message: string;
  role: string;
  experience: string;
  location: string;
  qualification: string;
  page_url: string;
  product: string;
  details: Record<string, string>;
};

function validateFields(fields: CareersFields): string | null {
  if (!fields.name || !fields.phone || !fields.email) {
    return "Name, phone and email are required";
  }
  if (!isEmail(fields.email)) {
    return "Enter a valid email address";
  }
  if (fields.phone.replace(/\D/g, "").length < 8) {
    return "Enter a valid phone number";
  }
  if (fields.altPhone && fields.altPhone.replace(/\D/g, "").length < 8) {
    return "Enter a valid alternate phone number";
  }
  if (!fields.role) {
    return "Please select the position you are applying for";
  }
  if (!fields.experience) {
    return "Please enter your experience";
  }
  if (!fields.location) {
    return "Please enter your preferred location";
  }
  if (!fields.qualification) {
    return "Please enter your qualification";
  }
  return null;
}

function fileFromForm(form: FormData, names: string[]): File | null {
  for (const name of names) {
    const entry = form.get(name);
    if (entry instanceof File && entry.size > 0) return entry;
  }
  return null;
}

function parseDetails(raw: string): Record<string, string> {
  if (!raw) return {};
  const clipped = clip(raw, FIELD_LIMITS.detailsJson);
  try {
    const parsed: unknown = JSON.parse(clipped);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && key.length <= 80) {
        out[clip(key, 80)] = clip(value, 500);
      }
      if (Object.keys(out).length >= 40) break;
    }
    return out;
  } catch {
    return {};
  }
}

async function parseRequest(request: Request): Promise<
  | { ok: true; fields: CareersFields; resume: File | null; photo: File | null }
  | { ok: false; error: string; status: number }
> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { ok: false, error: "Invalid form data", status: 400 };
    }

    return {
      ok: true,
      fields: {
        name: asString(form.get("name")),
        email: asString(form.get("email")),
        phone: asString(form.get("phone")),
        altPhone: asString(form.get("altPhone")),
        message: asString(form.get("message")),
        role: asString(form.get("role")),
        experience: asString(form.get("experience")),
        location: asString(form.get("location")),
        qualification: asString(form.get("qualification")),
        page_url: asString(form.get("page_url")),
        product: asString(form.get("product")),
        details: parseDetails(asString(form.get("details"))),
      },
      resume: fileFromForm(form, ["resume", "wpforms_7919_47"]),
      photo: fileFromForm(form, ["photo", "wpforms_7919_49"]),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON", status: 400 };
  }
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid payload", status: 400 };
  }
  const record = body as Record<string, unknown>;
  return {
    ok: true,
    fields: {
      name: asString(record.name),
      email: asString(record.email),
      phone: asString(record.phone),
      altPhone: asString(record.altPhone),
      message: asString(record.message),
      role: asString(record.role),
      experience: asString(record.experience),
      location: asString(record.location),
      qualification: asString(record.qualification),
      page_url: asString(record.page_url),
      product: asString(record.product),
      details: parseDetails(asString(record.details)),
    },
    resume: null,
    photo: null,
  };
}

function fileMeta(meta: ResumeMeta) {
  return {
    originalName: meta.originalName,
    storedName: meta.storedName,
    mimeType: meta.mimeType,
    size: meta.size,
    storagePath: meta.storagePath,
    storedAt: meta.storedAt,
  };
}

export async function POST(request: Request) {
  const originDenied = assertSameOrigin(request);
  if (originDenied) return originDenied;

  const limited = rateLimit(`careers:${clientIp(request)}`, 5, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const parsed = await parseRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const { fields, resume, photo } = parsed;
  fields.name = clip(fields.name, FIELD_LIMITS.name);
  fields.email = clip(fields.email, FIELD_LIMITS.email);
  fields.phone = clip(fields.phone, FIELD_LIMITS.phone);
  fields.altPhone = clip(fields.altPhone, FIELD_LIMITS.phone);
  fields.message = clip(fields.message, FIELD_LIMITS.message);
  fields.role = clip(fields.role, FIELD_LIMITS.role);
  fields.experience = clip(fields.experience, FIELD_LIMITS.experience);
  fields.location = clip(fields.location, FIELD_LIMITS.location);
  fields.qualification = clip(fields.qualification, FIELD_LIMITS.qualification);
  fields.page_url = clip(fields.page_url, FIELD_LIMITS.page_url);
  fields.product = clip(fields.product, FIELD_LIMITS.product);

  const fieldError = validateFields(fields);
  if (fieldError) {
    return NextResponse.json({ ok: false, error: fieldError }, { status: 400 });
  }

  if (!photo) {
    return NextResponse.json(
      { ok: false, error: "Please upload your photo (JPG or PDF, max 5MB)." },
      { status: 400 },
    );
  }
  const photoCheck = validatePhotoFile(photo);
  if (!photoCheck.ok) {
    return NextResponse.json({ ok: false, error: photoCheck.error }, { status: 400 });
  }

  if (!resume) {
    return NextResponse.json(
      { ok: false, error: "Please attach your resume (PDF, DOC, or DOCX, max 5MB)." },
      { status: 400 },
    );
  }
  const resumeCheck = validateResumeFile(resume);
  if (!resumeCheck.ok) {
    return NextResponse.json({ ok: false, error: resumeCheck.error }, { status: 400 });
  }

  let photoMeta: ResumeMeta;
  let resumeMeta: ResumeMeta;
  try {
    photoMeta = await storePhotoFile(photo);
    resumeMeta = await storeResumeFile(resume);
  } catch (err) {
    console.error("[careers] file store failed", err);
    return NextResponse.json(
      { ok: false, error: "Unable to store files. Please try again." },
      { status: 500 },
    );
  }

  let dbId: string;
  try {
    const saved = await saveCareerSubmission({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      altPhone: fields.altPhone,
      role: fields.role,
      experience: fields.experience,
      location: fields.location,
      qualification: fields.qualification,
      message: fields.message,
      pageUrl: fields.page_url,
      details: fields.details,
      photo: photoMeta,
      resume: resumeMeta,
    });
    dbId = saved.id;
    if (saved.excelError) console.error("[careers] excel", saved.excelError);
    if (saved.googleSheetsError) console.error("[careers] sheets", saved.googleSheetsError);
  } catch (err) {
    console.error("[careers] database save failed", err);
    return NextResponse.json(
      { ok: false, error: "Unable to save your application. Please try again." },
      { status: 500 },
    );
  }

  // Non-blocking JSONL backup
  await persistCareersJsonl({
    kind: "careers",
    id: dbId,
    ...fields,
    photo: fileMeta(photoMeta),
    resume: fileMeta(resumeMeta),
  }).catch((err) => console.error("[careers] jsonl backup failed", err));

  return NextResponse.json({
    ok: true,
    id: dbId,
    photo: { name: photoMeta.originalName, size: photoMeta.size },
    resume: { name: resumeMeta.originalName, size: resumeMeta.size },
  });
}
