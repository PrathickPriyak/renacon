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

export async function saveProductSubmission(input: ProductInput): Promise<PersistResult> {
  const row = await prisma.productSubmission.create({
    data: {
      formType: "product",
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message ?? "",
      product: input.product ?? "",
      productPath: input.productPath ?? "",
      pageUrl: input.pageUrl ?? "",
      detailsJson: jsonString(input.details ?? input),
    },
  });
  const excel = await syncExcel("product");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendProductToGoogleSheet({
      id: row.id,
      submittedAt: row.submittedAt.toISOString(),
      name: row.name,
      email: row.email,
      phone: row.phone,
      product: row.product,
      productPath: row.productPath,
      message: row.message,
      pageUrl: row.pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }
  return {
    id: row.id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
  };
}

export async function saveCareerSubmission(input: CareerInput): Promise<PersistResult> {
  const photo = input.photo;
  const resume = input.resume;
  const row = await prisma.careerSubmission.create({
    data: {
      formType: "career",
      name: input.name,
      email: input.email,
      phone: input.phone,
      altPhone: input.altPhone ?? "",
      role: input.role ?? "",
      experience: input.experience ?? "",
      location: input.location ?? "",
      qualification: input.qualification ?? "",
      message: input.message ?? "",
      pageUrl: input.pageUrl ?? "",
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
  const excel = await syncExcel("career");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendCareerToGoogleSheet({
      id: row.id,
      submittedAt: row.submittedAt.toISOString(),
      name: row.name,
      email: row.email,
      phone: row.phone,
      altPhone: row.altPhone,
      role: row.role,
      experience: row.experience,
      location: row.location,
      qualification: row.qualification,
      message: row.message,
      photo: row.photoOriginalName || row.photoStoredName,
      resume: row.resumeOriginalName || row.resumeStoredName,
      pageUrl: row.pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }
  return {
    id: row.id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
  };
}

export async function saveContactSubmission(input: ContactInput): Promise<PersistResult> {
  const row = await prisma.contactSubmission.create({
    data: {
      formType: "contact",
      name: input.name,
      phone: input.phone,
      city: input.city ?? "",
      products: input.products ?? "",
      email: input.email ?? "",
      message: input.message ?? "",
      pageUrl: input.pageUrl ?? "",
      detailsJson: jsonString(input.details ?? input),
    },
  });
  const excel = await syncExcel("contact");
  let googleSheetsError: string | null = null;
  if (isGoogleSheetsConfigured()) {
    const sheet = await appendContactToGoogleSheet({
      id: row.id,
      submittedAt: row.submittedAt.toISOString(),
      name: row.name,
      phone: row.phone,
      city: row.city,
      products: row.products,
      email: row.email,
      message: row.message,
      pageUrl: row.pageUrl,
    });
    if (!sheet.ok) googleSheetsError = sheet.error;
  }
  return {
    id: row.id,
    excelPath: excel.path,
    excelError: excel.error,
    googleSheetsError,
  };
}
