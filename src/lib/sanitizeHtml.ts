import DOMPurify from "isomorphic-dompurify";

const WP_ORIGIN = "https://renacon.in";

function absolutizeWpPaths(html: string): string {
  return html
    .replace(
      /(src|href)=(["'])\/(wp-content|wp-includes)\//gi,
      `$1=$2${WP_ORIGIN}/$3/`,
    )
    .replace(
      /url\(\s*(['"]?)\/(wp-content|wp-includes)\//gi,
      `url($1${WP_ORIGIN}/$2/`,
    );
}

/**
 * Sanitize mirrored WordPress page HTML.
 * Keeps layout markup (incl. style/data-*); strips scripts and dangerous embeds.
 */
export function sanitizeMirroredHtml(html: string): string {
  if (!html) return "";
  const cleaned = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "target",
      "rel",
      "loading",
      "decoding",
    ],
    FORBID_TAGS: ["script", "object", "embed", "link", "meta", "base", "form"],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
  return absolutizeWpPaths(cleaned);
}

/**
 * Stricter sanitizer for news article bodies (escaped titles/images separately).
 */
export function sanitizeTrustedHtml(html: string): string {
  if (!html) return "";
  const cleaned = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe", "figure", "figcaption"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "decoding", "target", "rel"],
    FORBID_TAGS: ["script", "style", "object", "embed", "link", "meta", "base", "form"],
  });
  return absolutizeWpPaths(cleaned);
}
