import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  getConfiguredAdminSecret,
  secretsEqual,
} from "@/lib/adminAuth";
import { assertSameOrigin, clientIp, rateLimit, rateLimitResponse } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const originDenied = assertSameOrigin(request);
  if (originDenied) return originDenied;

  const limited = rateLimit(`admin-login:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const secret = getConfiguredAdminSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 503 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "dev", adminCookieOptions());
    return res;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const provided =
    typeof body === "object" && body !== null && "secret" in body
      ? String((body as { secret?: unknown }).secret || "").trim()
      : "";

  if (!provided || !secretsEqual(provided, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, secret, adminCookieOptions());
  return res;
}

export async function DELETE(request: Request) {
  const originDenied = assertSameOrigin(request);
  if (originDenied) return originDenied;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(0), maxAge: 0 });
  return res;
}
