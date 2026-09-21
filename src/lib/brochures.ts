/** Product-page brochure PDFs in public/assets/brochures, keyed by page slug. */
export const brochureFiles: Record<string, string> = {
  "renacon-aac-blocks": "T0004-V1-Renacon-AAC-Blocks.pdf",
  "renabond-aac-joint-mortar": "T0011-V1-Renabond-AAC-Joint-Mortar.pdf",
  "renaplast-readymix-plaster": "T0005-V1-Renaplast-RMP.pdf",
  "renafix-floor-top-hardener": "T0008-V1-Renafix-Floor-Top-Hardener.pdf",
  "cement-mortar": "T0012-V1-Renafix-Cement-Mortar.pdf",
  "renacon-wall-putty": "T0006-V1-Renacon-Wall-Putty-Coarse.pdf",
  "renafix-201-tile-adhesive": "T0001-V2-Renafix-201.pdf",
  "renafix-211": "T0002-V1-Renafix-211.pdf",
  "renafix-222-tile-adhesive": "T0003-V1-Renafix-222.pdf",
  "renafix-tile-grout": "T0010-VO-Renafix-Unsanded-Tile-Grout.pdf",
  "renafix-gp-grout": "T0009-V1-Renafix-GP-Grout.pdf",
  "rapid-wall-installation": "AAC-panel-Brochure-AW_Final.pdf",
};

/** Same-origin download URLs for mapped product pages. */
export const brochureUrls: Record<string, string> = Object.fromEntries(
  Object.entries(brochureFiles).map(([slug, file]) => [
    slug,
    `/assets/brochures/${file}`,
  ]),
);

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

/** Public URL for this page's brochure, or null when none is configured. */
export function resolveBrochureUrl(pathnameOrSlug: string): string | null {
  const slug = slugFromPath(pathnameOrSlug);
  return brochureUrls[slug] || null;
}

export function brochureTitle(slug: string): string {
  return brochureTitles[slug] || "Renacon Product Brochure";
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
