import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "renacon_admin";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Constant-time string compare (hashes first so lengths may differ safely). */
export function secretsEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function cookieValue(request: Request, name: string): string {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return "";
}

export function getConfiguredAdminSecret(): string {
  return (process.env.ADMIN_SECRET || "").trim();
}

/** Extract admin token from Authorization / x-admin-secret / cookie (never query string). */
export function extractAdminToken(request: Request): string {
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  if (bearer) return bearer;
  const header = (request.headers.get("x-admin-secret") || "").trim();
  if (header) return header;
  return cookieValue(request, ADMIN_COOKIE).trim();
}

/**
 * Gate for export/admin API routes.
 * Production: ADMIN_SECRET required (fail closed).
 * Development: empty secret allows local access.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = getConfiguredAdminSecret();
  if (!secret) {
    if (isProduction()) {
      return NextResponse.json(
        { ok: false, error: "Admin not configured" },
        { status: 503 },
      );
    }
    return null;
  }

  const token = extractAdminToken(request);
  if (token && secretsEqual(token, secret)) return null;

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

/** Server-component / page helper: is the caller authenticated? */
export function isAdminAuthenticated(token: string): boolean {
  const secret = getConfiguredAdminSecret();
  if (!secret) return !isProduction();
  return Boolean(token && secretsEqual(token, secret));
}

export function adminCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
