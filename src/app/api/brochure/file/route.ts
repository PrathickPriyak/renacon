import { NextResponse } from "next/server";
import { brochureTitle, buildSimplePdf, slugFromPath } from "@/lib/brochures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product = slugFromPath(searchParams.get("product") || "renacon");
  const title = brochureTitle(product);
  const pdf = buildSimplePdf(title, [
    `Product: ${title}`,
    "Visit https://renacon.in for specifications and technical data.",
    "Contact: info@renacon.in",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ]);

  const filename = `${product || "renacon"}-brochure.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
