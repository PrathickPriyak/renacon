import { readPartial } from "@/lib/wpPages";

/** Mobile offcanvas menu — same markup WpInteractions toggles. */
export function SiteOffcanvas() {
  const html = readPartial("_offcanvas.html");
  return (
    <div
      className="renacon-site-offcanvas"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
