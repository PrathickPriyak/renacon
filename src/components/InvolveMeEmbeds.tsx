"use client";

import { useEffect } from "react";

const EMBED_SCRIPT = "https://dimensions.involve.me/embed";
const EMBED_BASE = "https://dimensions.involve.me";
const SCRIPT_ID = "renacon-involveme-embed";

type BrandquizEmbed = {
  baseurl?: string;
  embeds?: string[];
  initialized?: boolean;
  init?: () => void;
  embed?: () => void;
  divSelector?: string;
};

declare global {
  interface Window {
    brandquizEmbed?: BrandquizEmbed;
  }
}

function ensureBaseUrl(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".involveme_embed, .brandquiz_embed").forEach((el) => {
    if (!el.getAttribute("data-baseurl")) {
      el.setAttribute("data-baseurl", EMBED_BASE);
    }
    // Prefer dimensions host — app.involve.me 404s these Renacon projects
    el.setAttribute("data-baseurl", EMBED_BASE);
  });
}

function mountIframesFallback(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".involveme_embed, .brandquiz_embed").forEach((el) => {
    if (el.querySelector("iframe")) return;
    const project =
      el.getAttribute("data-project") || el.getAttribute("data-embed") || "";
    if (!project) return;

    const base = el.getAttribute("data-baseurl") || EMBED_BASE;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "web-share; fullscreen; autoplay");
    iframe.setAttribute("title", `Calculator: ${project}`);
    iframe.loading = "lazy";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.minHeight = "520px";
    iframe.style.overflow = "hidden";
    const params = new URLSearchParams({
      embed: "1",
      src: document.location.href,
    });
    if (document.referrer) params.set("_referrer", document.referrer);
    iframe.src = `${base.replace(/\/$/, "")}/${project}?${params.toString()}`;
    el.style.maxWidth = "100%";
    el.appendChild(iframe);
  });
}

function loadEmbedScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.brandquizEmbed?.init) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("InvolveMe embed script failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${EMBED_SCRIPT}?v=renacon-calc-202609171015`;
    script.async = true;
    script.className = "involve-embed-script";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("InvolveMe embed script failed"));
    document.body.appendChild(script);
  });
}

function runEmbed(): void {
  const api = window.brandquizEmbed;
  if (!api) {
    mountIframesFallback(document);
    return;
  }

  api.baseurl = EMBED_BASE;
  // Clear tracked embeds so closed→open accordion hosts still get iframes
  // if the first pass left them empty (hidden max-height:0 content).
  const hosts = Array.from(
    document.querySelectorAll<HTMLElement>(".involveme_embed, .brandquiz_embed"),
  );
  const missingProjects = hosts
    .filter((el) => !el.querySelector("iframe"))
    .map(
      (el) =>
        el.getAttribute("data-project") || el.getAttribute("data-embed") || "",
    )
    .filter(Boolean);
  if (missingProjects.length && Array.isArray(api.embeds)) {
    api.embeds = api.embeds.filter((id) => !missingProjects.includes(id));
  }

  if (typeof api.init === "function" && !api.initialized) {
    api.init();
  } else if (typeof api.embed === "function") {
    api.embed();
  } else if (typeof api.init === "function") {
    api.init();
  }

  // If script ran but left empty hosts, fall back to direct iframes
  if (hosts.some((el) => !el.querySelector("iframe"))) {
    mountIframesFallback(document);
  }
}

/**
 * Hydrate Involve.me calculator widgets inside mirrored WordPress HTML.
 * Scripts inside dangerouslySetInnerHTML do not execute, so we load the
 * official embed loader (and iframe fallback) on the client.
 */
export function InvolveMeEmbeds() {
  useEffect(() => {
    if (!/\/calculator\/?$/.test(window.location.pathname)) return;
    if (!document.querySelector(".involveme_embed, .brandquiz_embed")) return;

    ensureBaseUrl(document);
    document.body.classList.add("renacon-page-calculator", "stk--anim-init");

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const boot = async () => {
      try {
        await loadEmbedScript();
        if (cancelled) return;
        ensureBaseUrl(document);
        runEmbed();
      } catch {
        if (!cancelled) mountIframesFallback(document);
      }
    };

    void boot();

    // Re-trigger height / embed when an accordion opens (hidden iframes)
    const onToggle = (e: Event) => {
      const details = e.target;
      if (!(details instanceof HTMLDetailsElement)) return;
      if (!details.classList.contains("stk-block-accordion") &&
          !details.classList.contains("wp-block-stackable-accordion")) {
        return;
      }
      if (!details.open) return;
      window.setTimeout(() => {
        ensureBaseUrl(details);
        runEmbed();
        details.querySelectorAll("iframe").forEach((iframe) => {
          try {
            iframe.contentWindow?.postMessage(
              { source: "involveme_embed_host", type: "requestHeight" },
              "*",
            );
          } catch {
            /* cross-origin */
          }
        });
      }, 50);
    };
    document.addEventListener("toggle", onToggle, true);
    cleanups.push(() => document.removeEventListener("toggle", onToggle, true));

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
