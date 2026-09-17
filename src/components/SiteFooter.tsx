import { readPartial } from "@/lib/wpPages";

/** Clean Blocksy footer (no compromised .in casino markup). */
export function SiteFooter() {
  const html = readPartial("_footer.html");
  return <div className="renacon-site-footer" dangerouslySetInnerHTML={{ __html: html }} />;
}
