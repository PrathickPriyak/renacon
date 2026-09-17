/** Known / fallback brochure download targets keyed by page path slug. */
export const brochureUrls: Record<string, string> = {
  "renacon-aac-blocks": "/api/brochure/file/?product=renacon-aac-blocks",
  "renabond-aac-joint-mortar": "/api/brochure/file/?product=renabond-aac-joint-mortar",
  "renaplast-readymix-plaster": "/api/brochure/file/?product=renaplast-readymix-plaster",
  "renafix-floor-top-hardener": "/api/brochure/file/?product=renafix-floor-top-hardener",
  "cement-mortar": "/api/brochure/file/?product=cement-mortar",
  "renacon-wall-putty": "/api/brochure/file/?product=renacon-wall-putty",
  "renafix-201-tile-adhesive": "/api/brochure/file/?product=renafix-201-tile-adhesive",
  "renafix-211": "/api/brochure/file/?product=renafix-211",
  "renafix-222-tile-adhesive": "/api/brochure/file/?product=renafix-222-tile-adhesive",
  "renafix-333": "/api/brochure/file/?product=renafix-333",
  "renafix-tile-adhesive-444": "/api/brochure/file/?product=renafix-tile-adhesive-444",
  "renafix-tile-grout": "/api/brochure/file/?product=renafix-tile-grout",
  "renafix-gp-grout": "/api/brochure/file/?product=renafix-gp-grout",
  "rapid-wall-installation": "/api/brochure/file/?product=rapid-wall-installation",
  "renafix-tile-adhesive": "/api/brochure/file/?product=renafix-tile-adhesive",
  "renafix-grout": "/api/brochure/file/?product=renafix-grout",
};

export const brochureTitles: Record<string, string> = {
  "renacon-aac-blocks": "Renacon AAC Blocks Brochure",
  "renabond-aac-joint-mortar": "Renabond AAC Joint Mortar Brochure",
  "renaplast-readymix-plaster": "Renaplast Readymix Plaster Brochure",
  "renafix-floor-top-hardener": "Renafix Floor Top Hardener Brochure",
  "cement-mortar": "Renafix Cement Mortar Brochure",
  "renacon-wall-putty": "Renacon Wall Putty Brochure",
  "renafix-201-tile-adhesive": "Renafix 201 Tile Adhesive Brochure",
  "renafix-211": "Renafix 211 Brochure",
  "renafix-222-tile-adhesive": "Renafix 222 Tile Adhesive Brochure",
  "renafix-333": "Renafix 333 Brochure",
  "renafix-tile-adhesive-444": "Renafix 444 Brochure",
  "renafix-tile-grout": "Renafix Tile Grout Brochure",
  "renafix-gp-grout": "Renafix GP Grout Brochure",
  "rapid-wall-installation": "Renacon Rapid Wall Brochure",
  "renafix-tile-adhesive": "Renafix Tile Adhesive Brochure",
  "renafix-grout": "Renafix Grout Brochure",
};

export function slugFromPath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "").split("/")[0] || "";
}

export function resolveBrochureUrl(pathnameOrSlug: string): string {
  const slug = slugFromPath(pathnameOrSlug);
  return brochureUrls[slug] || `/api/brochure/file/?product=${encodeURIComponent(slug || "renacon")}`;
}

export function brochureTitle(slug: string): string {
  return brochureTitles[slug] || "Renacon Product Brochure";
}

/** Minimal valid PDF bytes for a one-page text brochure. */
export function buildSimplePdf(title: string, lines: string[]): Uint8Array {
  const safeTitle = title.replace(/[()\\]/g, " ");
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "50 780 Td",
    `(${safeTitle}) Tj`,
    "/F1 11 Tf",
    "0 -28 Td",
    "(Renacon — Green building materials) Tj",
    "0 -22 Td",
    "(Thank you for verifying your details.) Tj",
    ...lines.flatMap((line) => {
      const safe = line.replace(/[()\\]/g, " ").slice(0, 90);
      return ["0 -18 Td", `(${safe}) Tj`];
    }),
    "ET",
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function isBrochurePath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return (
    path.includes("renabond") ||
    path.includes("renaplast") ||
    path.includes("renafix") ||
    path.includes("renacon-") ||
    path.includes("cement") ||
    path.includes("rapid-wall")
  );
}
