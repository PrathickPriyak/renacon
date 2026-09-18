/**
 * Paste into: Google Sheet → Extensions → Apps Script
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/
 *
 * Deploy → New deployment → Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the Web app URL into GOOGLE_SHEETS_WEBHOOK_URL (local .env + Vercel).
 */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var tab = body.tab || "Contact";
    var headers = body.headers || [];
    var row = body.row || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tab);
    if (!sheet) {
      sheet = ss.insertSheet(tab);
    }
    if (sheet.getLastRow() === 0 && headers.length) {
      sheet.appendRow(headers);
    }
    if (row.length) {
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: "renacon-form-sheets" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
