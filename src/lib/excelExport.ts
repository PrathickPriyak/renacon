import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import ExcelJS from "exceljs";
import type { CareerSubmission, ContactSubmission, ProductSubmission } from "@prisma/client";

export type ExcelKind = "product" | "career" | "contact";

const FILE_NAMES: Record<ExcelKind, string> = {
  product: "product-submissions.xlsx",
  career: "career-submissions.xlsx",
  contact: "contact-submissions.xlsx",
};

function iso(value: Date): string {
  return value.toISOString();
}

async function resolveExportDirs(): Promise<string[]> {
  return [join(process.cwd(), "data", "exports"), join(tmpdir(), "renacon-exports")];
}

/** Best-effort write of a workbook buffer to disk (local/dev). Returns path or null. */
export async function writeExcelBuffer(kind: ExcelKind, buffer: Buffer): Promise<string | null> {
  const name = FILE_NAMES[kind];
  for (const dir of await resolveExportDirs()) {
    try {
      await mkdir(dir, { recursive: true });
      const path = join(dir, name);
      await writeFile(path, buffer);
      return path;
    } catch (err) {
      console.error("[excel] write failed", dir, err);
    }
  }
  return null;
}

export async function buildProductWorkbook(rows: ProductSubmission[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Renacon";
  wb.created = new Date();
  const sheet = wb.addWorksheet("Product submissions");
  sheet.columns = [
    { header: "ID", key: "id", width: 28 },
    { header: "Submitted At", key: "submittedAt", width: 24 },
    { header: "Form Type", key: "formType", width: 12 },
    { header: "Name", key: "name", width: 22 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Product", key: "product", width: 28 },
    { header: "Product Path", key: "productPath", width: 28 },
    { header: "Message", key: "message", width: 40 },
    { header: "Page URL", key: "pageUrl", width: 28 },
  ];
  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      submittedAt: iso(row.submittedAt),
      formType: row.formType,
      name: row.name,
      email: row.email,
      phone: row.phone,
      product: row.product,
      productPath: row.productPath,
      message: row.message,
      pageUrl: row.pageUrl,
    });
  }
  sheet.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildCareerWorkbook(rows: CareerSubmission[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Renacon";
  wb.created = new Date();
  const sheet = wb.addWorksheet("Career submissions");
  sheet.columns = [
    { header: "ID", key: "id", width: 28 },
    { header: "Submitted At", key: "submittedAt", width: 24 },
    { header: "Form Type", key: "formType", width: 12 },
    { header: "Name", key: "name", width: 22 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Alternate Phone", key: "altPhone", width: 16 },
    { header: "Role / Department", key: "role", width: 22 },
    { header: "Experience / Period", key: "experience", width: 18 },
    { header: "Location", key: "location", width: 16 },
    { header: "Qualification", key: "qualification", width: 28 },
    { header: "Message", key: "message", width: 32 },
    { header: "Photo File", key: "photo", width: 28 },
    { header: "Resume File", key: "resume", width: 28 },
    { header: "Page URL", key: "pageUrl", width: 24 },
  ];
  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      submittedAt: iso(row.submittedAt),
      formType: row.formType,
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
  }
  sheet.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildContactWorkbook(rows: ContactSubmission[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Renacon";
  wb.created = new Date();
  const sheet = wb.addWorksheet("Contact submissions");
  sheet.columns = [
    { header: "ID", key: "id", width: 28 },
    { header: "Submitted At", key: "submittedAt", width: 24 },
    { header: "Form Type", key: "formType", width: 12 },
    { header: "Name", key: "name", width: 22 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "City", key: "city", width: 18 },
    { header: "Products", key: "products", width: 28 },
    { header: "Email", key: "email", width: 28 },
    { header: "Message", key: "message", width: 36 },
    { header: "Page URL", key: "pageUrl", width: 24 },
  ];
  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      submittedAt: iso(row.submittedAt),
      formType: row.formType,
      name: row.name,
      phone: row.phone,
      city: row.city,
      products: row.products,
      email: row.email,
      message: row.message,
      pageUrl: row.pageUrl,
    });
  }
  sheet.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function excelFileName(kind: ExcelKind): string {
  return FILE_NAMES[kind];
}
