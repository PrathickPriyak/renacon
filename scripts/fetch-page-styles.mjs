#!/usr/bin/env node
/**
 * Fetch page-specific Stackable (stk-block-styles) CSS from renacon.in
 * into content/page-styles/{slug}.css — required for product background images.
 *
 * Usage: node scripts/fetch-page-styles.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "content/page-styles");

const PRODUCTS = [
  "our-products",
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
];

const STYLE_RE = /<style([^>]*)>(.*?)<\/style>/gis;

function extractStyles(html) {
  const chunks = [];
  for (const m of html.matchAll(STYLE_RE)) {
    const attrs = m[1] || "";
    const body = (m[2] || "").trim();
    if (!body) continue;
    const keep =
      attrs.includes("stk-block-styles") ||
      (body.includes("background-image") &&
        (body.includes("wp-content") ||
          body.includes("stk-") ||
          body.includes("ugb-")));
    if (keep) chunks.push(body);
  }
  return [...new Set(chunks)].join("\n\n");
}

function normalizeCss(css) {
  return css
    .replace(/url\(\/\//g, "url(https://")
    .replace(
      /url\((['"]?)\/(wp-content|wp-includes)\//g,
      "url($1https://renacon.in/$2/",
    );
}

mkdirSync(outDir, { recursive: true });
const manifest = {};

for (const slug of PRODUCTS) {
  const url = `https://renacon.in/${slug}/`;
  process.stdout.write(`Fetching ${url} … `);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 RenaconMirrorBot/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const css = normalizeCss(extractStyles(html));
    writeFileSync(join(outDir, `${slug}.css`), css ? `${css}\n` : "", "utf8");
    const bgs = [...css.matchAll(/background-image\s*:\s*url\(([^)]+)\)/g)].map(
      (m) => m[1].replace(/['"]/g, ""),
    );
    manifest[slug] = { bytes: css.length, backgrounds: bgs.length, urls: bgs };
    console.log(`OK (${css.length}b, ${bgs.length} bg)`);
  } catch (err) {
    console.log(`FAIL ${err}`);
  }
}

writeFileSync(
  join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${Object.keys(manifest).length} style files → content/page-styles/`);
