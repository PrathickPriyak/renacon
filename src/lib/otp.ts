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
  // eslint-disable-next-line no-var
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

function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).length >= 8;
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
  devOtp?: string;
};

export async function sendOtp(phoneRaw: string, name?: string): Promise<SendOtpResult | { ok: false; error: string }> {
  if (!isValidPhone(phoneRaw)) {
    return { ok: false, error: "Enter a valid phone number" };
  }
  const phone = normalizePhone(phoneRaw);
  const otp = String(randomInt(100000, 999999));
  const store = await loadStore();
  prune(store);
  store.otps[phone] = {
    otp,
    phone,
    name: name?.trim() || undefined,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  await saveStore(store);

  const demoMode = !(
    process.env.SMS_API_KEY ||
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.TWILIO_ACCOUNT_SID
  );

  if (!demoMode) {
    try {
      await sendSmsOptional(phone, otp);
    } catch (err) {
      console.error("[otp] SMS send failed", err);
      // Still keep OTP for demo verification if SMS fails
    }
  }

  console.info(`[otp] phone=${phone} otp=${otp} expiresIn=${OTP_TTL_MS / 1000}s demo=${demoMode}`);

  return {
    ok: true,
    expiresInSec: OTP_TTL_MS / 1000,
    demoMode,
    ...(demoMode ? { devOtp: otp } : {}),
  };
}

async function sendSmsOptional(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const apiKey = process.env.SMS_API_KEY;
  const message = `Your Renacon brochure verification code is ${otp}. Valid for 5 minutes.`;

  if (accountSid && authToken && from) {
    const body = new URLSearchParams({
      To: phone.startsWith("+") ? phone : `+91${phone}`,
      From: from,
      Body: message,
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
      throw new Error(`Twilio error ${res.status}`);
    }
    return;
  }

  if (apiKey) {
    // Generic hook — providers vary; log when only a key is present.
    console.info("[otp] SMS_API_KEY present; integrate provider-specific send here", {
      phone,
      apiKeyPrefix: apiKey.slice(0, 4),
    });
  }
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
    return { ok: false, error: "Enter the 6-digit OTP" };
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
    return { ok: false, error: "Invalid OTP" };
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
  // One-time use for brochure download
  delete store.tokens[key];
  await saveStore(store);
  return { ok: true, phone: record.phone };
}

export { normalizePhone, isValidPhone };
