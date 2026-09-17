import { createHash, randomBytes, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const OTP_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const STORE_PATH = join(tmpdir(), "renacon-otp", "store.json");

type OtpRecord = {
  otp: string;
  phone: string;
  name?: string;
  expiresAt: number;
  attempts: number;
  provider: "local" | "msg91" | "twilio";
};

type TokenRecord = {
  phone: string;
  expiresAt: number;
};

type Store = {
  otps: Record<string, OtpRecord>;
  tokens: Record<string, TokenRecord>;
};

declare global {
  // eslint-disable-next-line no-var -- required for Next.js hot-reload singleton
  var __renaconOtpStore: Store | undefined;
}

function memoryStore(): Store {
  if (!globalThis.__renaconOtpStore) {
    globalThis.__renaconOtpStore = { otps: {}, tokens: {} };
  }
  return globalThis.__renaconOtpStore;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function e164India(phone: string): string {
  const local = normalizePhone(phone);
  return `91${local}`;
}

function isValidPhone(phone: string): boolean {
  const n = normalizePhone(phone);
  // Indian mobiles are 10 digits starting 6-9; still allow broader international
  return n.length >= 8 && n.length <= 15;
}

function smsConfigured(): boolean {
  if (process.env.MSG91_AUTH_KEY) return true;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    return true;
  }
  if (process.env.FAST2SMS_API_KEY) return true;
  return false;
}

function forceDemo(): boolean {
  return process.env.OTP_DEMO_MODE === "1" || process.env.OTP_DEMO_MODE === "true";
}

function isProductionSms(): boolean {
  return smsConfigured() && !forceDemo();
}

async function loadStore(): Promise<Store> {
  const mem = memoryStore();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    mem.otps = { ...parsed.otps, ...mem.otps };
    mem.tokens = { ...parsed.tokens, ...mem.tokens };
  } catch {
    // empty / missing file is fine
  }
  return mem;
}

async function saveStore(store: Store): Promise<void> {
  memoryStore().otps = store.otps;
  memoryStore().tokens = store.tokens;
  try {
    await mkdir(join(tmpdir(), "renacon-otp"), { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store), "utf8");
  } catch {
    // memory fallback only
  }
}

function prune(store: Store, now = Date.now()): void {
  for (const [key, value] of Object.entries(store.otps)) {
    if (value.expiresAt <= now) delete store.otps[key];
  }
  for (const [key, value] of Object.entries(store.tokens)) {
    if (value.expiresAt <= now) delete store.tokens[key];
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SendOtpResult = {
  ok: true;
  expiresInSec: number;
  demoMode: boolean;
  provider: string;
  message: string;
  /** Only returned in demo mode — never in production SMS mode */
  devOtp?: string;
};

async function sendViaMsg91(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) throw new Error("MSG91_AUTH_KEY missing");

  const mobile = e164India(phone);
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const sender = process.env.MSG91_SENDER_ID || "RENACN";

  // Preferred: MSG91 OTP API (template-based)
  if (templateId) {
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", templateId);
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("otp", otp);
    url.searchParams.set("otp_expiry", "5");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile,
        otp,
        otp_expiry: 5,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`MSG91 OTP API failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return;
  }

  // Fallback: MSG91 sendhttp SMS
  const message = `Your Renacon brochure OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;
  const url = new URL("https://api.msg91.com/api/sendhttp.php");
  url.searchParams.set("authkey", authKey);
  url.searchParams.set("mobiles", mobile);
  url.searchParams.set("message", message);
  url.searchParams.set("sender", sender.slice(0, 6));
  url.searchParams.set("route", "4");
  url.searchParams.set("country", "91");
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || /^\s*error/i.test(text)) {
    throw new Error(`MSG91 SMS failed: ${text.slice(0, 200)}`);
  }
}

async function sendViaTwilio(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials incomplete");
  }
  const to = phone.startsWith("+") ? phone : `+91${normalizePhone(phone)}`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Your Renacon brochure OTP is ${otp}. Valid for 5 minutes. Do not share this code.`,
  });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function sendViaFast2Sms(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY missing");
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      message: `Your Renacon brochure OTP is ${otp}. Valid for 5 minutes.`,
      language: "english",
      flash: 0,
      numbers: normalizePhone(phone),
    }),
  });
  const json = (await res.json()) as { return?: boolean; message?: string | string[] };
  if (!res.ok || json.return === false) {
    throw new Error(`Fast2SMS failed: ${JSON.stringify(json.message ?? res.status)}`);
  }
}

async function deliverOtpSms(phone: string, otp: string): Promise<"msg91" | "twilio" | "fast2sms"> {
  const preferred = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (preferred === "msg91" || (!preferred && process.env.MSG91_AUTH_KEY)) {
    await sendViaMsg91(phone, otp);
    return "msg91";
  }
  if (
    preferred === "twilio" ||
    (!preferred && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ) {
    await sendViaTwilio(phone, otp);
    return "twilio";
  }
  if (preferred === "fast2sms" || (!preferred && process.env.FAST2SMS_API_KEY)) {
    await sendViaFast2Sms(phone, otp);
    return "fast2sms";
  }

  // Try providers in order if SMS_PROVIDER unset
  if (process.env.MSG91_AUTH_KEY) {
    await sendViaMsg91(phone, otp);
    return "msg91";
  }
  if (process.env.TWILIO_ACCOUNT_SID) {
    await sendViaTwilio(phone, otp);
    return "twilio";
  }
  if (process.env.FAST2SMS_API_KEY) {
    await sendViaFast2Sms(phone, otp);
    return "fast2sms";
  }
  throw new Error("No SMS provider configured");
}

export async function sendOtp(
  phoneRaw: string,
  name?: string,
): Promise<SendOtpResult | { ok: false; error: string }> {
  if (!isValidPhone(phoneRaw)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number" };
  }
  const phone = normalizePhone(phoneRaw);
  if (phone.length === 10 && !/^[6-9]\d{9}$/.test(phone)) {
    return { ok: false, error: "Enter a valid Indian mobile number" };
  }

  const production = isProductionSms();
  if (!production && process.env.OTP_REQUIRE_SMS === "1") {
    return {
      ok: false,
      error:
        "SMS is required but not configured. Set MSG91_AUTH_KEY (or Twilio / Fast2SMS) on the server.",
    };
  }

  const otp = String(randomInt(100000, 999999));
  const store = await loadStore();
  prune(store);

  let provider: OtpRecord["provider"] = "local";
  if (production) {
    try {
      const used = await deliverOtpSms(phone, otp);
      provider = used === "fast2sms" ? "local" : used;
    } catch (err) {
      console.error("[otp] SMS send failed", err);
      return {
        ok: false,
        error: "Unable to send OTP SMS right now. Please try again in a moment.",
      };
    }
  }

  store.otps[phone] = {
    otp,
    phone,
    name: name?.trim() || undefined,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    provider,
  };
  await saveStore(store);

  if (production) {
    console.info(`[otp] sent phone=***${phone.slice(-4)} provider=${provider}`);
  } else {
    console.info(`[otp] DEMO phone=${phone} otp=${otp}`);
  }

  return {
    ok: true,
    expiresInSec: OTP_TTL_MS / 1000,
    demoMode: !production,
    provider: production ? provider : "demo",
    message: production
      ? "OTP sent to your mobile number. Enter the code you received."
      : "Demo mode: SMS provider not configured.",
    ...(production ? {} : { devOtp: otp }),
  };
}

export async function verifyOtp(
  phoneRaw: string,
  otpRaw: string,
): Promise<{ ok: true; verificationToken: string; expiresInSec: number } | { ok: false; error: string }> {
  if (!isValidPhone(phoneRaw)) {
    return { ok: false, error: "Enter a valid phone number" };
  }
  const phone = normalizePhone(phoneRaw);
  const otp = otpRaw.trim();
  if (!/^\d{6}$/.test(otp)) {
    return { ok: false, error: "Enter the 6-digit OTP from your SMS" };
  }

  const store = await loadStore();
  prune(store);
  const record = store.otps[phone];
  if (!record) {
    return { ok: false, error: "OTP expired or not found. Please send OTP again." };
  }
  if (record.expiresAt <= Date.now()) {
    delete store.otps[phone];
    await saveStore(store);
    return { ok: false, error: "OTP expired. Please send OTP again." };
  }
  record.attempts += 1;
  if (record.attempts > 5) {
    delete store.otps[phone];
    await saveStore(store);
    return { ok: false, error: "Too many attempts. Please send OTP again." };
  }
  if (record.otp !== otp) {
    await saveStore(store);
    return { ok: false, error: "Invalid OTP. Check the SMS and try again." };
  }

  delete store.otps[phone];
  const verificationToken = randomBytes(24).toString("hex");
  store.tokens[hashToken(verificationToken)] = {
    phone,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  await saveStore(store);

  return {
    ok: true,
    verificationToken,
    expiresInSec: TOKEN_TTL_MS / 1000,
  };
}

export async function consumeVerificationToken(
  tokenRaw: string,
  phoneRaw?: string,
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const token = tokenRaw.trim();
  if (!token) {
    return { ok: false, error: "Phone verification required. Please verify OTP first." };
  }
  const store = await loadStore();
  prune(store);
  const key = hashToken(token);
  const record = store.tokens[key];
  if (!record || record.expiresAt <= Date.now()) {
    if (record) {
      delete store.tokens[key];
      await saveStore(store);
    }
    return { ok: false, error: "Verification expired. Please verify OTP again." };
  }
  if (phoneRaw) {
    const phone = normalizePhone(phoneRaw);
    if (phone && phone !== record.phone) {
      return { ok: false, error: "Verified phone does not match the form phone number." };
    }
  }
  delete store.tokens[key];
  await saveStore(store);
  return { ok: true, phone: record.phone };
}

export { normalizePhone, isValidPhone, isProductionSms, smsConfigured };
