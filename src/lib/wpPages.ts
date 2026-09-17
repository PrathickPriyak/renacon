import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "content/pages-html");
const pageStylesRoot = join(process.cwd(), "content/page-styles");

const PRODUCT_SLUGS = new Set([
  "cement-mortar",
  "rapid-wall-installation",
  "renabond-aac-joint-mortar",
  "renacon-aac-blocks",
  "renacon-wall-putty",
  "renafix-201-tds",
  "renafix-201-tile-adhesive",
  "renafix-211",
  "renafix-211-tds",
  "renafix-222-tds",
  "renafix-222-tile-adhesive",
  "renafix-333",
  "renafix-floor-top-hardener",
  "renafix-gp-grout",
  "renafix-grout",
  "renafix-tile-adhesive-444",
  "renafix-tile-adhesive",
  "renafix-tile-grout",
  "renaplast-readymix-plaster",
]);

export function isProductSlug(slug: string): boolean {
  return PRODUCT_SLUGS.has(slug);
}

export function readPageHtml(slug: string): string | null {
  const path = join(root, `${slug}.html`);
  if (!existsSync(path)) return null;
  let html = readFileSync(path, "utf8");

  if (isProductSlug(slug)) {
    html = html.replace(
      /(<article\b[^>]*\bclass=")([^"]*)(")/i,
      (_m, pre: string, classes: string, post: string) => {
        if (/\brenacon-product-page\b/.test(classes)) {
          return `${pre}${classes}${post}`;
        }
        return `${pre}${classes} renacon-product-page${post}`;
      },
    );
  }

  return html;
}

/** Stackable page CSS (background-image columns) mirrored from renacon.in */
export function readPageStyles(slug: string): string | null {
  const path = join(pageStylesRoot, `${slug}.css`);
  if (!existsSync(path)) return null;
  const css = readFileSync(path, "utf8").trim();
  return css || null;
}

export function listPageStyleSlugs(): string[] {
  if (!existsSync(pageStylesRoot)) return [];
  return readdirSync(pageStylesRoot)
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.replace(/\.css$/, ""));
}

export function readPartial(name: "_header.html" | "_footer.html" | "_offcanvas.html"): string {
  return readFileSync(join(root, name), "utf8");
}

export const WP_STYLESHEETS = [
  "/wp-mirror/css/01.css",
  "/wp-mirror/css/02.css",
  "/wp-mirror/css/03.css",
  "/wp-mirror/css/04.css",
  "/wp-mirror/css/05.css",
  "/wp-mirror/css/06.css",
  "/wp-mirror/css/07.css",
  "/wp-mirror/css/08.css",
  "/wp-mirror/css/09.css",
  "/wp-mirror/css/10.css",
  "/wp-mirror/css/11-simply-gallery.css",
  "/wp-mirror/css/12-forminator-base.css",
  "/wp-mirror/css/13-forminator-utils.css",
  "/wp-mirror/css/14-forminator-grid.css",
  "/wp-mirror/css/15-blocksy-forminator.css",
  "/wp-mirror/css/16-form-5347.css",
  "/wp-mirror/css/17-form-1979.css",
  "/wp-mirror/css/inline-global-styles-inline-css.css",
  "/wp-mirror/css/inline-wp-custom-css.css",
  "/wp-mirror/css/inline-editor_plus-plugin-frontend-style-inline-css.css",
  "/wp-mirror/css/inline-ugb-style-css-inline-css.css",
  "/wp-mirror/css/inline-getwid-blocks-inline-css.css",
  "/wp-mirror/css/inline-wp-block-heading-inline-css.css",
  "/wp-mirror/css/inline-wp-block-image-inline-css.css",
  "/wp-mirror/css/inline-wp-block-columns-inline-css.css",
  "/wp-mirror/css/inline-wp-block-paragraph-inline-css.css",
  "/wp-mirror/css/inline-anon-4434.css",
  "/wp-mirror/css/site-overrides.css",
];
