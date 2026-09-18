import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  buildCareerWorkbook,
  buildContactWorkbook,
  buildProductWorkbook,
  writeExcelBuffer,
  type ExcelKind,
} from "@/lib/excelExport";
import {
  appendCareerToGoogleSheet,
  appendContactToGoogleSheet,
  appendProductToGoogleSheet,
  isGoogleSheetsConfigured,
} from "@/lib/googleSheets";
import type { ResumeMeta } from "@/lib/resumes";

function jsonString(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function fallbackId(): string {
  return `sheet_${randomUUID()}`;
}

export type ProductInput = {
  name: string;
  email: string;
  phone: string;
  message?: string;
  product?: string;
  productPath?: string;
  pageUrl?: string;
  details?: Record<string, unknown>;
};

export type CareerInput = {
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  role?: string;
  experience?: string;
  location?: string;
  qualification?: string;
  message?: string;
  pageUrl?: string;
  details?: Record<string, unknown>;
  photo?: ResumeMeta | null;
  resume?: ResumeMeta | null;
};

export type ContactInput = {
  name: string;
  phone: string;
  city?: string;
  products?: string;
  email?: string;
  message?: string;
  pageUrl?: string;
  details?: Record<string, unknown>;
};

export type PersistResult = {
  id: string;
  excelPath: string | null;
  excelError: string | null;
  googleSheetsError: string | null;
  dbError: string | null;
};

async function syncExcel(kind: ExcelKind): Promise<{ path: string | null; error: string | null }> {
  try {
    let buffer: Buffer;
    if (kind === "product") {
      const rows = await prisma.productSubmission.findMany({ orderBy: { submittedAt: "desc" } });
      buffer = await buildProductWorkbook(rows);
    } else if (kind === "career") {
      const rows = await prisma.careerSubmission.findMany({ orderBy: { submittedAt: "desc" } });
      buffer = await buildCareerWorkbook(rows);
    } else {
      const rows = await prisma.contactSubmission.findMany({ orderBy: { submittedAt: "desc" } });
      buffer = await buildContactWorkbook(rows);
    }
    const path = await writeExcelBuffer(kind, buffer);
    if (!path) {
      // Not fatal on serverless — export API still works from DB.
      console.warn(`[excel] could not persist ${kind} workbook to disk (ephemeral FS?)`);
      return { path: null, error: null };
    }
    return { path, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Excel sync failed";
    console.error(`[excel] ${kind} sync failed`, err);
    return { path: null, error: message };
  }
}

function requirePersisted(result: PersistResult): PersistResult {
  // On Vercel, SQLite may be unavailable — Google Sheet is the durable store.
  if (result.dbError && result.googleSheetsError) {
    throw new Error(result.googleSheetsError || result.dbError || "Unable to save submission");
  }
  if (result.dbError && !isGoogleSheetsConfigured()) {
    throw new Error(result.dbError);
  }
  return result;
}

export async function saveProductSubmission(input: ProductInput): Promise<PersistResult> {
  let id = fallbackId();
  let submittedAt = new Date();
  let dbError: string | null = null;
  const name = input.name;
  const email = input.email;
  const phone = input.phone;
  const message = input.message ?? "";
  const product = input.product ?? "";
  const productPath = input.productPath ?? "";
  const pageUrl = input.pageUrl ?? "";

  try {
    const row = await prisma.productSubmission.create({
      data: {
        formType: "product",
        name,
        email,
        phone,
        message,
        product,
        productPath,
        pageUrl,
        detailsJson: jsonString(input.details ?? input),
      },
    });
    id = row.id;
    submittedAt = row.submittedAt;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database save failed";
    console.error("[product] database save failed — will still try Google Sheets", err);
  }

  const excel = dbError ? { path: null, error: dbError } : await syncExcel("product");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendProductToGoogleSheet({
      id,
      submittedAt: submittedAt.toISOString(),
      name,
      email,
      phone,
      product,
      productPath,
      message,
      pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }

  return requirePersisted({
    id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
    dbError,
  });
}

export async function saveCareerSubmission(input: CareerInput): Promise<PersistResult> {
  const photo = input.photo;
  const resume = input.resume;
  let id = fallbackId();
  let submittedAt = new Date();
  let dbError: string | null = null;

  const name = input.name;
  const email = input.email;
  const phone = input.phone;
  const altPhone = input.altPhone ?? "";
  const role = input.role ?? "";
  const experience = input.experience ?? "";
  const location = input.location ?? "";
  const qualification = input.qualification ?? "";
  const message = input.message ?? "";
  const pageUrl = input.pageUrl ?? "";
  const photoName = photo?.originalName ?? photo?.storedName ?? "";
  const resumeName = resume?.originalName ?? resume?.storedName ?? "";

  try {
    const row = await prisma.careerSubmission.create({
      data: {
        formType: "career",
        name,
        email,
        phone,
        altPhone,
        role,
        experience,
        location,
        qualification,
        message,
        pageUrl,
        photoOriginalName: photo?.originalName ?? "",
        photoStoredName: photo?.storedName ?? "",
        photoStoragePath: photo?.storagePath ?? "",
        photoMimeType: photo?.mimeType ?? "",
        photoSize: photo?.size ?? 0,
        resumeOriginalName: resume?.originalName ?? "",
        resumeStoredName: resume?.storedName ?? "",
        resumeStoragePath: resume?.storagePath ?? "",
        resumeMimeType: resume?.mimeType ?? "",
        resumeSize: resume?.size ?? 0,
        detailsJson: jsonString(input.details ?? {}),
      },
    });
    id = row.id;
    submittedAt = row.submittedAt;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database save failed";
    console.error("[career] database save failed — will still try Google Sheets", err);
  }

  const excel = dbError ? { path: null, error: dbError } : await syncExcel("career");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendCareerToGoogleSheet({
      id,
      submittedAt: submittedAt.toISOString(),
      name,
      email,
      phone,
      altPhone,
      role,
      experience,
      location,
      qualification,
      message,
      photo: photoName,
      resume: resumeName,
      pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }

  return requirePersisted({
    id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
    dbError,
  });
}

export async function saveContactSubmission(input: ContactInput): Promise<PersistResult> {
  let id = fallbackId();
  let submittedAt = new Date();
  let dbError: string | null = null;
  const name = input.name;
  const phone = input.phone;
  const city = input.city ?? "";
  const products = input.products ?? "";
  const email = input.email ?? "";
  const message = input.message ?? "";
  const pageUrl = input.pageUrl ?? "";

  try {
    const row = await prisma.contactSubmission.create({
      data: {
        formType: "contact",
        name,
        phone,
        city,
        products,
        email,
        message,
        pageUrl,
        detailsJson: jsonString(input.details ?? input),
      },
    });
    id = row.id;
    submittedAt = row.submittedAt;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database save failed";
    console.error("[contact] database save failed — will still try Google Sheets", err);
  }

  const excel = dbError ? { path: null, error: dbError } : await syncExcel("contact");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendContactToGoogleSheet({
      id,
      submittedAt: submittedAt.toISOString(),
      name,
      phone,
      city,
      products,
      email,
      message,
      pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }

  return requirePersisted({
    id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
    dbError,
  });
}
