import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { buildContactWorkbook, excelFileName } from "@/lib/excelExport";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const rows = await prisma.contactSubmission.findMany({ orderBy: { submittedAt: "desc" } });
    const buffer = await buildContactWorkbook(rows);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${excelFileName("contact")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export] contact failed", err);
    return NextResponse.json({ ok: false, error: "Export failed" }, { status: 500 });
  }
}
