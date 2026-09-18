import { readFileSync } from "node:fs";
import { join } from "node:path";
import { localizeMediaHtml, localizeMediaUrl } from "@/lib/localizeMedia";

export type Post = {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string | null;
  contentHtml: string;
};

/** Keep media on this deployment (public/assets/wp-content via /wp-content rewrite). */
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
  return localizeMediaHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe(?![^>]*youtube)[^>]*>[\s\S]*?<\/iframe>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, ""),
  );
}
