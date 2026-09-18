import { readPartial } from "@/lib/wpPages";
import { sanitizeMirroredHtml } from "@/lib/sanitizeHtml";

/** Mobile offcanvas menu — same markup WpInteractions toggles. */
export function SiteOffcanvas() {
  const html = sanitizeMirroredHtml(readPartial("_offcanvas.html"));
  return (
    <div
      className="renacon-site-offcanvas"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
