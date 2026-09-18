/**
 * Paste into: Google Sheet → Extensions → Apps Script
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/
 *
 * Deploy → New deployment → Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the Web app URL into GOOGLE_SHEETS_WEBHOOK_URL (local .env + Vercel).
 *
 * Creates / updates tabs: Product, Careers, Contact
 */

var TAB_HEADERS = {
  Product: [
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
  Careers: [
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
  Contact: [
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

function getSpreadsheet_(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss && body && body.spreadsheetId) {
    ss = SpreadsheetApp.openById(body.spreadsheetId);
  }
  if (!ss) {
    throw new Error("Spreadsheet not found (bind script to the sheet or pass spreadsheetId)");
  }
  return ss;
}

function ensureSheet_(ss, tab, headers) {
  var sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function ensureAllTabs_(ss) {
  ensureSheet_(ss, "Product", TAB_HEADERS.Product);
  ensureSheet_(ss, "Careers", TAB_HEADERS.Careers);
  ensureSheet_(ss, "Contact", TAB_HEADERS.Contact);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var tab = body.tab || "Contact";
    var headers = body.headers && body.headers.length ? body.headers : TAB_HEADERS[tab] || [];
    var row = body.row || [];
    var ss = getSpreadsheet_(body);

    // Always ensure Product / Careers / Contact tabs exist
    ensureAllTabs_(ss);

    var sheet = ensureSheet_(ss, tab, headers);
    if (row.length) {
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        tab: tab,
        rowCount: sheet.getLastRow(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) ensureAllTabs_(ss);
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        service: "renacon-form-sheets",
        tabs: ["Product", "Careers", "Contact"],
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
