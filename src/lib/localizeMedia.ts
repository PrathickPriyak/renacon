/**
 * Point WordPress media at this deployment.
 * Files live in public/assets/wp-content; /wp-content/* is rewritten there.
 * Videos are served via /r-media/* so Vercel WAF cannot block .mp4 static files.
 */

const ORIGIN_HOSTS = new Set(["renacon.in", "www.renacon.in"]);

export function localizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  let path = trimmed;
  if (trimmed.startsWith("//")) {
    try {
      const u = new URL(`https:${trimmed}`);
      if (ORIGIN_HOSTS.has(u.hostname)) {
        path = `${u.pathname}${u.search}`;
      } else {
        return `https:${trimmed}`;
      }
    } catch {
      return `https:${trimmed}`;
    }
  } else if (
    trimmed.startsWith("https://renacon.in/") ||
    trimmed.startsWith("https://www.renacon.in/")
  ) {
    try {
      const u = new URL(trimmed);
      path = `${u.pathname}${u.search}`;
    } catch {
      return trimmed;
    }
  }

  return rewriteVideoPath(path);
}

function rewriteVideoPath(path: string): string {
  return path.replace(
    /^\/wp-content\/([^?#]+\.(?:mp4|webm|mov))(\?[^#]*)?(#.*)?$/i,
    "/r-media/$1$2$3",
  );
}

/** Rewrite every origin media URL inside HTML or CSS. */
export function localizeMediaHtml(html: string): string {
  return html
    .replace(
      /https?:\/\/(?:www\.)?renacon\.in\/(wp-content|wp-includes)\//gi,
      "/$1/",
    )
    .replace(/\/\/(?:www\.)?renacon\.in\/(wp-content|wp-includes)\//gi, "/$1/")
    .replace(
      /(["'(\s])\/wp-content\/([^"' )\]]+\.(?:mp4|webm|mov))/gi,
      "$1/r-media/$2",
    );
}
