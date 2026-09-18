import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Post = {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string | null;
  contentHtml: string;
};

/** Keep media on this deployment (public/wp-content). Fallback rewrite still proxies missing files. */
function localizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    try {
      const u = new URL(`https:${trimmed}`);
      if (u.hostname === "renacon.in" || u.hostname === "www.renacon.in") {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      return `https:${trimmed}`;
    }
  }
  if (trimmed.startsWith("https://renacon.in/") || trimmed.startsWith("https://www.renacon.in/")) {
    try {
      const u = new URL(trimmed);
      return `${u.pathname}${u.search}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function firstContentImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ? localizeMediaUrl(match[1]) : null;
}

function normalizePost(post: Post): Post {
  const contentHtml = sanitizeHtml(post.contentHtml || "");
  const image =
    (post.image ? localizeMediaUrl(post.image) : null) ||
    firstContentImage(contentHtml);
  return {
    ...post,
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

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe(?![^>]*youtube)[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
    // Prefer same-origin media (mirrored into public/wp-content)
    .replace(
      /(src|href)=(["'])https?:\/\/(?:www\.)?renacon\.in\/(wp-content|wp-includes)\//gi,
      "$1=$2/$3/",
    )
    .replace(
      /url\(\s*(['"]?)https?:\/\/(?:www\.)?renacon\.in\/(wp-content|wp-includes)\//gi,
      "url($1/$2/",
    );
}
