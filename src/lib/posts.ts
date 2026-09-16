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

let cache: Post[] | null = null;

export function getPosts(): Post[] {
  if (cache) return cache;
  const raw = readFileSync(join(process.cwd(), "content/posts.json"), "utf8");
  cache = JSON.parse(raw) as Post[];
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
    .replace(/javascript:/gi, "");
}
