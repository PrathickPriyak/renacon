import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { storeResumeFile, validateResumeFile, type ResumeMeta } from "@/lib/resumes";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function persistCareersSubmission(payload: Record<string, unknown>): Promise<void> {
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
      // try next location (read-only FS on some hosts)
    }
  }

  console.info("[submission]", "careers", line.trim());
}

type CareersFields = {
  name: string;
  email: string;
  phone: string;
  message: string;
  role: string;
  experience: string;
  location: string;
  qualification: string;
  page_url: string;
  product: string;
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

async function parseRequest(request: Request): Promise<
  | { ok: true; fields: CareersFields; resume: File | null }
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

    const resumeEntry = form.get("resume");
    const resume =
      resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : null;

    return {
      ok: true,
      fields: {
        name: asString(form.get("name")),
        email: asString(form.get("email")),
        phone: asString(form.get("phone")),
        message: asString(form.get("message")),
        role: asString(form.get("role")),
        experience: asString(form.get("experience")),
        location: asString(form.get("location")),
        qualification: asString(form.get("qualification")),
        page_url: asString(form.get("page_url")),
        product: asString(form.get("product")),
      },
      resume,
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
      message: asString(record.message),
      role: asString(record.role),
      experience: asString(record.experience),
      location: asString(record.location),
      qualification: asString(record.qualification),
      page_url: asString(record.page_url),
      product: asString(record.product),
    },
    resume: null,
  };
}

export async function POST(request: Request) {
  const parsed = await parseRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const { fields, resume } = parsed;
  const fieldError = validateFields(fields);
  if (fieldError) {
    return NextResponse.json({ ok: false, error: fieldError }, { status: 400 });
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

  let resumeMeta: ResumeMeta;
  try {
    resumeMeta = await storeResumeFile(resume);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to store resume";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  await persistCareersSubmission({
    kind: "careers",
    ...fields,
    resume: {
      originalName: resumeMeta.originalName,
      storedName: resumeMeta.storedName,
      mimeType: resumeMeta.mimeType,
      size: resumeMeta.size,
      storagePath: resumeMeta.storagePath,
      storedAt: resumeMeta.storedAt,
    },
  });

  return NextResponse.json({
    ok: true,
    resume: {
      name: resumeMeta.originalName,
      size: resumeMeta.size,
    },
  });
}
