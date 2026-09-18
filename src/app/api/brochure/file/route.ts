import { NextResponse } from "next/server";
import { brochureTitle, buildSimplePdf, slugFromPath } from "@/lib/brochures";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security";

export async function GET(request: Request) {
  const limited = rateLimit(`brochure-file:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { searchParams } = new URL(request.url);
  const raw = slugFromPath(searchParams.get("product") || "renacon");
  const product = raw.replace(/[^a-z0-9-]/gi, "") || "renacon";
  const title = brochureTitle(product);
  const pdf = buildSimplePdf(title, [
    `Product: ${title}`,
    "Visit https://renacon.in for specifications and technical data.",
    "Contact: info@renacon.in",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ]);

  const filename = `${product}-brochure.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
