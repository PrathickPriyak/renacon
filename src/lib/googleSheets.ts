import { google, type sheets_v4 } from "googleapis";

/** Shared Renacon form submissions spreadsheet */
export const DEFAULT_SPREADSHEET_ID = "1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA";

export type SheetKind = "product" | "career" | "contact";

const TAB_NAMES: Record<SheetKind, string> = {
  product: "Product",
  career: "Careers",
  contact: "Contact",
};

const HEADERS: Record<SheetKind, string[]> = {
  product: [
    "Submitted At",
    "ID",
    "Name",
    "Email",
    "Phone",
    "Product",
    "Product Path",
    "Message",
    "Page URL",
  ],
  career: [
    "Submitted At",
    "ID",
    "Name",
    "Email",
    "Phone",
    "Alternate Phone",
    "Role",
    "Experience",
    "Location",
    "Qualification",
    "Message",
    "Photo File",
    "Resume File",
    "Page URL",
  ],
  contact: [
    "Submitted At",
    "ID",
    "Name",
    "Phone",
    "City",
    "Products",
    "Email",
    "Message",
    "Page URL",
  ],
};

function spreadsheetId(): string {
  return (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID).trim();
}

function hasServiceAccount(): boolean {
  if ((process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim()) return true;
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").trim();
  return Boolean(email && key);
}

function hasWebhook(): boolean {
  return Boolean((process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim());
}

/** True when Google Sheets sync is configured (service account or Apps Script webhook). */
export function isGoogleSheetsConfigured(): boolean {
  return hasServiceAccount() || hasWebhook();
}

type ServiceAccountJson = {
  client_email?: string;
  private_key?: string;
};

function loadServiceAccount(): { email: string; key: string } | null {
  const rawJson = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as ServiceAccountJson;
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, key: parsed.private_key };
      }
    } catch (err) {
      console.error("[google-sheets] invalid GOOGLE_SERVICE_ACCOUNT_JSON", err);
      return null;
    }
  }
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
  if (email && key) return { email, key };
  return null;
}

async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const sa = loadServiceAccount();
  if (!sa) return null;
  const auth = new google.auth.JWT({
    email: sa.email,
    key: sa.key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureTabWithHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetIdValue: string,
  kind: SheetKind,
): Promise<string> {
  const tab = TAB_NAMES[kind];
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetIdValue,
    fields: "sheets.properties.title",
  });
  const titles = new Set(
    (meta.data.sheets || [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t)),
  );

  if (!titles.has(tab)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdValue,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tab } } }],
      },
    });
  }

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdValue,
    range: `${tab}!A1:Z1`,
  });
  const firstRow = existing.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdValue,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS[kind]] },
    });
  }
  return tab;
}

async function appendViaApi(kind: SheetKind, row: string[]): Promise<void> {
  const sheets = await getSheetsClient();
  if (!sheets) throw new Error("Google service account not configured");
  const id = spreadsheetId();
  const tab = await ensureTabWithHeaders(sheets, id, kind);
  await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `${tab}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

async function appendViaWebhook(kind: SheetKind, row: string[]): Promise<void> {
  const url = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim();
  if (!url) throw new Error("GOOGLE_SHEETS_WEBHOOK_URL not set");

  const payload = JSON.stringify({
    kind,
    tab: TAB_NAMES[kind],
    headers: HEADERS[kind],
    row,
    spreadsheetId: spreadsheetId(),
  });

  // Apps Script executes doPost on the first POST, then returns 302 to an echo URL.
  // Treat 302 as success so Vercel serverless doesn't wait on the slow redirect hop.
  const postRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    redirect: "manual",
  });

  if (postRes.status >= 300 && postRes.status < 400) {
    return;
  }

  const text = await postRes.text();
  if (!postRes.ok) {
    throw new Error(`Sheets webhook failed (${postRes.status}): ${text.slice(0, 200)}`);
  }

  if (!text.trim()) return;
  try {
    const parsed = JSON.parse(text) as { ok?: boolean; error?: string };
    if (parsed.ok === false) {
      throw new Error(parsed.error || "Sheets webhook returned ok:false");
    }
  } catch (err) {
    if (err instanceof SyntaxError) return;
    throw err;
  }
}

export type ProductSheetRow = {
  id: string;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  product: string;
  productPath: string;
  message: string;
  pageUrl: string;
};

export type CareerSheetRow = {
  id: string;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  role: string;
  experience: string;
  location: string;
  qualification: string;
  message: string;
  photo: string;
  resume: string;
  pageUrl: string;
};

export type ContactSheetRow = {
  id: string;
  submittedAt: string;
  name: string;
  phone: string;
  city: string;
  products: string;
  email: string;
  message: string;
  pageUrl: string;
};

async function appendRow(kind: SheetKind, row: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isGoogleSheetsConfigured()) {
    return { ok: false, error: "Google Sheets not configured" };
  }
  try {
    if (hasServiceAccount()) {
      await appendViaApi(kind, row);
    } else {
      await appendViaWebhook(kind, row);
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sheets append failed";
    console.error(`[google-sheets] ${kind} append failed`, err);
    return { ok: false, error: message };
  }
}

export async function appendProductToGoogleSheet(
  row: ProductSheetRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return appendRow("product", [
    row.submittedAt,
    row.id,
    row.name,
    row.email,
    row.phone,
    row.product,
    row.productPath,
    row.message,
    row.pageUrl,
  ]);
}

export async function appendCareerToGoogleSheet(
  row: CareerSheetRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return appendRow("career", [
    row.submittedAt,
    row.id,
    row.name,
    row.email,
    row.phone,
    row.altPhone,
    row.role,
    row.experience,
    row.location,
    row.qualification,
    row.message,
    row.photo,
    row.resume,
    row.pageUrl,
  ]);
}

export async function appendContactToGoogleSheet(
  row: ContactSheetRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return appendRow("contact", [
    row.submittedAt,
    row.id,
    row.name,
    row.phone,
    row.city,
    row.products,
    row.email,
    row.message,
    row.pageUrl,
  ]);
}
