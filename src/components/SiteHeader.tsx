import { readPartial } from "@/lib/wpPages";
import { sanitizeMirroredHtml } from "@/lib/sanitizeHtml";

/** Blocksy header from `content/pages-html/_header.html` — keep DOM hooks for WpInteractions. */
export function SiteHeader() {
  const html = sanitizeMirroredHtml(readPartial("_header.html"));
  return (
    <div
      className="renacon-site-header"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
