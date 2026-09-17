import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GalleryItem = { title: string; image: string };

function load(name: string): GalleryItem[] {
  const raw = readFileSync(join(process.cwd(), "content", name), "utf8");
  return JSON.parse(raw) as GalleryItem[];
}

export function getProjects(): GalleryItem[] {
  return load("projects.json");
}

export function getMedia(): GalleryItem[] {
  return load("media.json");
}
