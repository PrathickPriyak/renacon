#!/usr/bin/env node
/**
 * Mirror WordPress media from renacon.in into public/assets/wp-content/...
 * so production serves images from this deployment (no remote dependency).
 * next.config rewrites /wp-content/* → /assets/wp-content/* for compatibility.
 *
 * Usage:
 *   node scripts/mirror-wp-media.mjs
 *   node scripts/mirror-wp-media.mjs --limit=200   # smoke test
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ORIGIN = "https://renacon.in";
const OUT = join(ROOT, "public/assets");
const CONCURRENCY = 12;
const EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".avif",
  ".bmp",
  ".jfif",
]);

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const TEXT_EXTS = new Set([
  ".html",
  ".css",
  ".json",
  ".tsx",
  ".ts",
  ".js",
  ".mjs",
  ".md",
  ".svg",
  ".txt",
]);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function cleanPath(raw) {
  let u = String(raw || "")
    .trim()
    .replace(/\\+$/g, "")
    .replace(/&amp;/g, "&")
    .split("?")[0]
    .split("#")[0];
  if (u.startsWith("//")) u = `https:${u}`;
  if (u.startsWith("https://www.renacon.in")) u = u.replace("https://www.renacon.in", ORIGIN);
  if (u.startsWith(ORIGIN)) u = u.slice(ORIGIN.length);
  if (!u.startsWith("/wp-content/") && !u.startsWith("/wp-includes/")) return null;
  const ext = extname(u.split("/").pop() || "").toLowerCase();
  if (!EXTS.has(ext)) return null;
  // decode %20 etc once
  try {
    u = decodeURIComponent(u);
  } catch {
    /* keep */
  }
  return u;
}

function collectFromText(text, into) {
  const patterns = [
    /(?:https?:\/\/(?:www\.)?renacon\.in)?(\/wp-content\/[^\s"'`)\]>,\\]+)/gi,
    /(?:https?:\/\/(?:www\.)?renacon\.in)?(\/wp-includes\/[^\s"'`)\]>,\\]+)/gi,
    /url\(\s*['"]?(\/wp-content\/[^)'"]+)/gi,
    /url\(\s*['"]?(\/wp-includes\/[^)'"]+)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text))) {
      const cleaned = cleanPath(m[1]);
      if (cleaned) into.add(cleaned);
    }
  }
  // srcset pieces
  const srcsetRe = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  let sm;
  while ((sm = srcsetRe.exec(text))) {
    for (const part of sm[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      const cleaned = cleanPath(url);
      if (cleaned) into.add(cleaned);
    }
  }
}

function collectFromRepo() {
  const into = new Set();
  for (const dir of ["content", "public", "src"]) {
    for (const file of walkFiles(join(ROOT, dir))) {
      if (!TEXT_EXTS.has(extname(file).toLowerCase())) continue;
      let text;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      collectFromText(text, into);
    }
  }
  return into;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "RenaconMirror/1.0", Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function collectFromLiveSite(into) {
  const pages = [
    "/",
    "/about-us/",
    "/why-renacon/",
    "/our-products/",
    "/contact-us/",
    "/careers/",
    "/calculator/",
    "/projects-2/",
    "/media/",
    "/news/",
    "/products/renaplast/",
    "/products/renacon-aac-blocks/",
    "/renacon-aac-blocks/",
    "/renaplast-readymix-plaster/",
    "/renabond-aac-joint-mortar/",
    "/renacon-wall-putty/",
  ];
  for (const path of pages) {
    try {
      const html = await fetchText(`${ORIGIN}${path}`);
      collectFromText(html, into);
      console.log(`  crawled ${path} (total ${into.size})`);
    } catch (err) {
      console.warn(`  skip crawl ${path}:`, err.message);
    }
  }
}

async function downloadOne(relPath) {
  const dest = join(OUT, relPath.replace(/^\//, ""));
  if (existsSync(dest) && statSync(dest).size > 0) {
    return { relPath, status: "exists", bytes: statSync(dest).size };
  }
  mkdirSync(dirname(dest), { recursive: true });
  const parts = relPath.split("/").filter(Boolean);
  const finalUrl = `${ORIGIN}/${parts.map(encodeURIComponent).join("/")}`;

  const res = await fetch(finalUrl, {
    headers: { "User-Agent": "RenaconMirror/1.0" },
    redirect: "follow",
  });
  if (!res.ok || !res.body) {
    return { relPath, status: `http_${res.status}`, bytes: 0 };
  }
  const tmp = `${dest}.part`;
  await pipeline(res.body, createWriteStream(tmp));
  const { renameSync } = await import("node:fs");
  renameSync(tmp, dest);
  return { relPath, status: "ok", bytes: statSync(dest).size };
}

async function runPool(items, worker, concurrency) {
  let i = 0;
  let ok = 0;
  let fail = 0;
  let exists = 0;
  let bytes = 0;
  const errors = [];

  async function next() {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      try {
        const r = await worker(item);
        if (r.status === "ok") {
          ok++;
          bytes += r.bytes;
        } else if (r.status === "exists") {
          exists++;
          bytes += r.bytes;
        } else {
          fail++;
          errors.push(`${r.status} ${r.relPath}`);
        }
      } catch (err) {
        fail++;
        errors.push(`${err.message} ${item}`);
      }
      if ((ok + fail + exists) % 50 === 0) {
        console.log(
          `  progress ${ok + fail + exists}/${items.length} ok=${ok} exists=${exists} fail=${fail}`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return { ok, fail, exists, bytes, errors };
}

async function main() {
  console.log("Collecting media paths from repo…");
  const paths = collectFromRepo();
  console.log(`  repo refs: ${paths.size}`);
  console.log("Crawling renacon.in key pages…");
  await collectFromLiveSite(paths);
  console.log(`  unique media paths: ${paths.size}`);

  let list = [...paths].sort();
  if (Number.isFinite(LIMIT) && LIMIT > 0) list = list.slice(0, LIMIT);

  console.log(`Downloading ${list.length} files → public/assets/ (concurrency ${CONCURRENCY})…`);
  const result = await runPool(list, downloadOne, CONCURRENCY);
  console.log(
    `Done. ok=${result.ok} exists=${result.exists} fail=${result.fail} bytes=${(
      result.bytes /
      1024 /
      1024
    ).toFixed(1)}MB`,
  );
  if (result.errors.length) {
    const manifest = join(ROOT, "public/assets/wp-content/_mirror-failures.txt");
    mkdirSync(dirname(manifest), { recursive: true });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(manifest, result.errors.slice(0, 500).join("\n") + "\n");
    console.log(`  wrote first failures to ${relative(ROOT, manifest)}`);
  }

  // Manifest of mirrored paths for ops
  const { writeFileSync } = await import("node:fs");
  const man = join(ROOT, "public/assets/wp-content/_mirrored-paths.txt");
  mkdirSync(dirname(man), { recursive: true });
  writeFileSync(man, list.join("\n") + "\n");
  console.log(`Manifest: ${list.length} paths`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
