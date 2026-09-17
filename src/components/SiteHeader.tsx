import { readPartial } from "@/lib/wpPages";

/** Blocksy header from `content/pages-html/_header.html` — keep DOM hooks for WpInteractions. */
export function SiteHeader() {
  const html = readPartial("_header.html");
  return <div className="renacon-site-header" dangerouslySetInnerHTML={{ __html: html }} />;
}
