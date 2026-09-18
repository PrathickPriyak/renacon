import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_ACCEPT = ".jpg,.jpeg,.pdf,image/jpeg,application/pdf";

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);
const PHOTO_EXT = new Set([".jpg", ".jpeg", ".pdf"]);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // browsers sometimes omit real MIME for .doc/.docx
]);

export type ResumeMeta = {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  storedAt: string;
};

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) return "";
  return filename.slice(idx).toLowerCase();
}

function sanitizeBaseName(filename: string): string {
  const base = filename.replace(/[/\\?%*:|"<>]/g, "_").trim() || "resume";
  return base.slice(0, 120);
}

export function validateResumeFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "Please attach your resume (PDF, DOC, or DOCX)." };
  }
  if (file.size > RESUME_MAX_BYTES) {
    return { ok: false, error: "Resume must be 5MB or smaller." };
  }
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "Resume must be a PDF, DOC, or DOCX file." };
  }
  const mime = (file.type || "").toLowerCase();
  // Extension is authoritative; reject only clearly wrong MIME types.
  if (
    mime &&
    !ALLOWED_MIME.has(mime) &&
    (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/"))
  ) {
    return { ok: false, error: "Resume must be a PDF, DOC, or DOCX file." };
  }
  return { ok: true };
}

export function validatePhotoFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "Please upload your photo (JPG or PDF)." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { ok: false, error: "Photo must be 5MB or smaller." };
  }
  const ext = extensionOf(file.name);
  if (!PHOTO_EXT.has(ext)) {
    return { ok: false, error: "Photo must be a JPG or PDF file." };
  }
  const mime = (file.type || "").toLowerCase();
  if (mime && (mime.startsWith("video/") || mime.startsWith("audio/"))) {
    return { ok: false, error: "Photo must be a JPG or PDF file." };
  }
  return { ok: true };
}

async function resolveResumeDirs(): Promise<string[]> {
  return [
    join(process.cwd(), "data", "submissions", "resumes"),
    join(tmpdir(), "renacon-submissions", "resumes"),
  ];
}

async function resolvePhotoDirs(): Promise<string[]> {
  return [
    join(process.cwd(), "data", "submissions", "photos"),
    join(tmpdir(), "renacon-submissions", "photos"),
  ];
}

/** Persist resume bytes; tries project data dir then /tmp (Vercel). */
export async function storeResumeFile(file: File): Promise<ResumeMeta> {
  const validation = validateResumeFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const ext = extensionOf(file.name) || ".pdf";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const id = randomBytes(4).toString("hex");
  const storedName = `${stamp}-${id}-${sanitizeBaseName(file.name.replace(/\.[^.]+$/, ""))}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dirs = await resolveResumeDirs();

  let lastError: unknown;
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
      const storagePath = join(dir, storedName);
      await writeFile(storagePath, buffer);
      return {
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        storedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }

  console.error("[careers] resume store failed", lastError);
  throw new Error("Unable to store resume right now. Please try again.");
}

/** Persist applicant photo bytes; tries project data dir then /tmp (Vercel). */
export async function storePhotoFile(file: File): Promise<ResumeMeta> {
  const validation = validatePhotoFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const ext = extensionOf(file.name) || ".jpg";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const id = randomBytes(4).toString("hex");
  const storedName = `${stamp}-${id}-${sanitizeBaseName(file.name.replace(/\.[^.]+$/, ""))}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dirs = await resolvePhotoDirs();

  let lastError: unknown;
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
      const storagePath = join(dir, storedName);
      await writeFile(storagePath, buffer);
      return {
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        storedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }

  console.error("[careers] photo store failed", lastError);
  throw new Error("Unable to store photo right now. Please try again.");
}
