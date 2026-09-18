import { readPartial } from "@/lib/wpPages";
import { sanitizeMirroredHtml } from "@/lib/sanitizeHtml";

/** Clean Blocksy footer (no compromised .in casino markup). */
export function SiteFooter() {
  const html = sanitizeMirroredHtml(readPartial("_footer.html"));
  return (
    <div
      className="renacon-site-footer"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
