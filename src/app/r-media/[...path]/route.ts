import { existsSync, createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const ASSET_ROOT = join(process.cwd(), "public", "assets", "wp-content");

function resolveAsset(parts: string[]): string | null {
  if (parts.length === 0) return null;
  if (parts.some((p) => p === ".." || p.includes("\0"))) return null;
  const rel = parts.join("/");
  const full = normalize(join(ASSET_ROOT, rel));
  if (!full.startsWith(ASSET_ROOT)) return null;
  if (existsSync(full) && statSync(full).isFile()) return full;
  return null;
}

function contentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

function streamResponse(
  filePath: string,
  rangeHeader: string | null,
): Response {
  const { size } = statSync(filePath);
  const type = contentType(filePath);
  const baseHeaders: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) {
      return new Response("Invalid range", { status: 416 });
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const chunkEnd = Math.min(end, size - 1);
    const nodeStream = createReadStream(filePath, { start, end: chunkEnd });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return new Response(webStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${chunkEnd}/${size}`,
        "Content-Length": String(chunkEnd - start + 1),
      },
    });
  }

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return new Response(webStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const filePath = resolveAsset(path ?? []);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }
  return streamResponse(filePath, request.headers.get("range"));
}

export async function HEAD(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const filePath = resolveAsset(path ?? []);
  if (!filePath) {
    return new Response(null, { status: 404 });
  }
  const { size } = statSync(filePath);
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": contentType(filePath),
      "Accept-Ranges": "bytes",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
