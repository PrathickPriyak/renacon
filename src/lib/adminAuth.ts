import { NextResponse } from "next/server";

/** Optional admin gate for export/admin routes. Empty ADMIN_SECRET = open (local/dev). */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = (process.env.ADMIN_SECRET || "").trim();
  if (!secret) return null;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret") || "";
  const fromHeader = request.headers.get("x-admin-secret") || "";
  if (fromQuery === secret || fromHeader === secret) return null;

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
