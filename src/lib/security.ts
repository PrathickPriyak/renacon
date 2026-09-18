import { NextResponse } from "next/server";

const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();

/** Best-effort in-memory rate limit (per server instance). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = RATE_BUCKETS.get(key);
  if (!existing || existing.resetAt <= now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Reject cross-origin state-changing requests (CSRF mitigation for multipart/JSON).
 * Allows missing Origin (same-origin navigations / some clients) when Referer matches.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const url = new URL(request.url);
  const expected = url.origin;
  const origin = request.headers.get("origin");
  if (origin) {
    if (origin !== expected) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    return null;
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).origin !== expected) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

/** Cap string length after trim. */
export function clip(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

/** Neutralize spreadsheet formula injection. */
export function sanitizeSheetCell(value: string): string {
  const s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
  return s;
}

export { escapeHtml, safeUrl } from "@/lib/htmlSafe";
