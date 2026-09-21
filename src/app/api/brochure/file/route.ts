import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { brochureFiles, slugFromPath } from "@/lib/brochures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product = slugFromPath(searchParams.get("product") || "");
  const filename = brochureFiles[product];
  if (!filename) {
    return NextResponse.json({ ok: false, error: "No brochure for this product" }, { status: 404 });
  }

  const filePath = join(process.cwd(), "public", "assets", "brochures", filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: "Brochure file missing" }, { status: 404 });
  }

  const pdf = readFileSync(filePath);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
