import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeTrustedHtml } from "@/lib/sanitizeHtml";
import { escapeHtml, safeUrl } from "@/lib/htmlSafe";

export type Post = {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string | null;
  contentHtml: string;
};

const WP_ORIGIN = "https://renacon.in";

function absolutizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/wp-content/") || trimmed.startsWith("/wp-includes/")) {
    return `${WP_ORIGIN}${trimmed}`;
  }
  return trimmed;
}

function firstContentImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ? absolutizeMediaUrl(match[1]) : null;
}

function normalizePost(post: Post): Post {
  const contentHtml = sanitizeHtml(post.contentHtml || "");
  const rawImage =
    (post.image ? absolutizeMediaUrl(post.image) : null) ||
    firstContentImage(contentHtml);
  const image = rawImage ? safeUrl(rawImage) || null : null;
  return {
    ...post,
    title: post.title || "",
    date: post.date || "",
    image,
    contentHtml,
  };
}

let cache: Post[] | null = null;

export function getPosts(): Post[] {
  if (cache) return cache;
  const raw = readFileSync(join(process.cwd(), "content/posts.json"), "utf8");
  const parsed = JSON.parse(raw) as Post[];
  cache = parsed.map(normalizePost);
  return cache;
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

/** @deprecated Prefer sanitizeTrustedHtml — kept for callers that import sanitizeHtml. */
export function sanitizeHtml(html: string): string {
  return sanitizeTrustedHtml(html);
}

export { escapeHtml, safeUrl };
