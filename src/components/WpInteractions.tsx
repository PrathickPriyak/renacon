"use client";

import { useEffect } from "react";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Prefer same-origin mirrored media under public/wp-content (rewrite falls back if missing). */
function localizeWpUrl(url: string): string {
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
      return `https:${trimmed}`;
    } catch {
      return `https:${trimmed}`;
    }
  }
  if (
    trimmed.startsWith("https://renacon.in/") ||
    trimmed.startsWith("https://www.renacon.in/")
  ) {
    try {
      const u = new URL(trimmed);
      return `${u.pathname}${u.search}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/** Derive a short accessible label from a media URL when alt is missing. */
function altFromMediaUrl(url: string): string {
  try {
    const path = new URL(url, "https://renacon.vercel.app").pathname;
    const base = path.split("/").pop() || "";
    const name = base.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
    return name ? name.replace(/\b\w/g, (c) => c.toUpperCase()) : "Renacon image";
  } catch {
    return "Renacon image";
  }
}

/** Fix relative / lazy WordPress media so product images actually paint. */
function hydrateWpImages(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const lazy =
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy-src") ||
      img.getAttribute("data-original");
    const current = img.getAttribute("src") || "";
    if (lazy && (!current || current.startsWith("data:"))) {
      img.setAttribute("src", localizeWpUrl(lazy));
    } else if (current) {
      const local = localizeWpUrl(current);
      if (local !== current) img.setAttribute("src", local);
    }

    const srcset =
      img.getAttribute("srcset") ||
      img.getAttribute("data-srcset") ||
      img.getAttribute("data-lazy-srcset");
    if (srcset) {
      const next = srcset
        .split(",")
        .map((part) => {
          const bits = part.trim().split(/\s+/);
          if (!bits[0]) return part.trim();
          bits[0] = localizeWpUrl(bits[0]);
          return bits.join(" ");
        })
        .join(", ");
      img.setAttribute("srcset", next);
    }

    // A11y: mirrored WP markup often omits alt — fill from filename when absent
    if (!img.hasAttribute("alt") || img.getAttribute("alt") === null) {
      const src = img.getAttribute("src") || lazy || "";
      img.setAttribute("alt", altFromMediaUrl(localizeWpUrl(src)));
    }
  });

  root.querySelectorAll<HTMLElement>("[style*='wp-content'], [style*='background']").forEach(
    (el) => {
      const style = el.getAttribute("style");
      if (!style || (!style.includes("/wp-content/") && !style.includes("renacon.in"))) return;
      el.setAttribute(
        "style",
        style.replace(
          /url\(\s*(['"]?)https?:\/\/(?:www\.)?renacon\.in\/(wp-content|wp-includes)\//gi,
          "url($1/$2/",
        ),
      );
    },
  );
}

/** Mark product media hooks — no invent scroll-fade (live Stackable has none). */
function initProductImagePolish(root: HTMLElement): void {
  root.classList.add("renacon-product-ix");
  root
    .querySelectorAll<HTMLElement>(
      ".wp-block-image, .stk-block-background, .stk-block-image, .wp-block-getwid-image-box",
    )
    .forEach((fig) => fig.classList.add("renacon-product-media"));
}

function initProductAccordions(
  root: HTMLElement,
  cleanups: Array<() => void>,
): void {
  const details = Array.from(
    root.querySelectorAll<HTMLDetailsElement>(
      "details.stk-block-accordion, details.wp-block-stackable-accordion",
    ),
  );
  details.forEach((el) => {
    el.classList.add("renacon-product-accordion");
    const onToggle = () => {
      el.classList.toggle("renacon-product-accordion-open", el.open);
    };
    onToggle();
    el.addEventListener("toggle", onToggle);
    cleanups.push(() => el.removeEventListener("toggle", onToggle));
  });
}

function normalizePath(path: string): string {
  if (!path) return "/";
  try {
    const u = path.startsWith("http") ? new URL(path) : null;
    const p = u ? u.pathname : path.split("?")[0]?.split("#")[0] || "/";
    const trimmed = p.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  } catch {
    return "/";
  }
}

/** Mark current page / ancestors in desktop + offcanvas menus from the URL. */
function markActiveNav(pathname: string) {
  const current = normalizePath(pathname);
  const scopes = document.querySelectorAll<HTMLElement>(
    "#header .menu, #offcanvas .mobile-menu ul",
  );

  scopes.forEach((menu) => {
    menu
      .querySelectorAll<HTMLElement>(
        ".current-menu-item, .current_page_item, .current-menu-ancestor, .current-menu-parent, .renacon-nav-active",
      )
      .forEach((el) => {
        el.classList.remove(
          "current-menu-item",
          "current_page_item",
          "current-menu-ancestor",
          "current-menu-parent",
          "renacon-nav-active",
        );
        el
          .querySelectorAll<HTMLElement>(
            ":scope > a.ct-menu-link, :scope > .ct-sub-menu-parent > a.ct-menu-link",
          )
          .forEach((a) => a.removeAttribute("aria-current"));
      });
  });

  const links = document.querySelectorAll<HTMLAnchorElement>(
    "#header .menu a.ct-menu-link, #offcanvas .mobile-menu a.ct-menu-link",
  );

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("#")) return;
    const target = normalizePath(href);
    const isExact = target === current;
    const isPrefix =
      target !== "/" &&
      (current === target || current.startsWith(`${target}/`));
    if (!isExact && !isPrefix) return;

    const item = link.closest<HTMLElement>("li.menu-item");
    if (!item) return;

    if (isExact) {
      item.classList.add(
        "current-menu-item",
        "current_page_item",
        "renacon-nav-active",
      );
      link.setAttribute("aria-current", "page");
    } else {
      item.classList.add("renacon-nav-active");
    }

    let parent = item.parentElement?.closest<HTMLElement>("li.menu-item");
    while (parent) {
      parent.classList.add(
        "current-menu-ancestor",
        "current-menu-parent",
        "renacon-nav-active",
      );
      parent = parent.parentElement?.closest<HTMLElement>("li.menu-item");
    }
  });
}

/** Enables Blocksy mobile menu and desktop dropdowns without WordPress JS. */
export function WpInteractions() {
  useEffect(() => {
    const offcanvas = document.getElementById("offcanvas");

    // IMPORTANT: do NOT match aria-label*="menu" — submenu chevrons use
    // "Expand dropdown menu" and would steal hamburger open/close.
    const openers = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-toggle-panel="#offcanvas"], .ct-header-trigger[data-toggle-panel="#offcanvas"]',
      ),
    ).filter(
      (el) =>
        !el.classList.contains("ct-toggle-dropdown-mobile") &&
        !el.closest("#offcanvas"),
    );

    const setOpenerState = (isOpen: boolean) => {
      openers.forEach((el) => {
        el.setAttribute("aria-expanded", isOpen ? "true" : "false");
        el.classList.toggle("renacon-menu-open", isOpen);
      });
      document.documentElement.classList.toggle("ct-panel-open", isOpen);
    };

    const open = () => {
      if (!offcanvas) return;
      offcanvas.classList.add("is-open", "active");
      offcanvas.removeAttribute("inert");
      offcanvas.setAttribute("aria-hidden", "false");
      const inner = offcanvas.querySelector<HTMLElement>(".ct-panel-inner");
      if (inner) {
        inner.style.transform = "none";
        inner.style.translate = "none";
        inner.style.left = "0";
      }
      offcanvas
        .querySelectorAll<HTMLElement>(".ct-panel-content[data-device='mobile']")
        .forEach((el) => {
          el.style.display = "block";
        });
      document.body.style.overflow = "hidden";
      setOpenerState(true);
    };
    const close = () => {
      if (!offcanvas) return;
      offcanvas.classList.remove("is-open", "active");
      offcanvas.setAttribute("inert", "");
      offcanvas.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      setOpenerState(false);
      offcanvas
        .querySelectorAll<HTMLElement>(
          ".dropdown-active, .menu-item-has-children.ct-active",
        )
        .forEach((item) => {
          item.classList.remove("dropdown-active", "ct-active");
        });
      offcanvas
        .querySelectorAll<HTMLElement>(".ct-toggle-dropdown-mobile")
        .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    };

    const onOpenerClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (!offcanvas) return;
      if (offcanvas.classList.contains("is-open")) close();
      else open();
    };

    setOpenerState(false);
    openers.forEach((el) => el.addEventListener("click", onOpenerClick));

    const setMobileItemOpen = (item: HTMLElement, willOpen: boolean) => {
      const parentList = item.parentElement;
      if (parentList && willOpen) {
        Array.from(parentList.children).forEach((sib) => {
          if (!(sib instanceof HTMLElement) || sib === item) return;
          if (
            sib.classList.contains("menu-item-has-children") ||
            /children/.test(sib.className)
          ) {
            sib.classList.remove("dropdown-active", "ct-active");
            sib
              .querySelectorAll<HTMLElement>(
                ":scope > .ct-sub-menu-parent .ct-toggle-dropdown-mobile, :scope > a + .ct-toggle-dropdown-mobile",
              )
              .forEach((b) => b.setAttribute("aria-expanded", "false"));
          }
        });
      }
      item.classList.toggle("dropdown-active", willOpen);
      item.classList.toggle("ct-active", willOpen);
      item
        .querySelectorAll<HTMLElement>(
          ":scope > .ct-sub-menu-parent .ct-toggle-dropdown-mobile",
        )
        .forEach((b) =>
          b.setAttribute("aria-expanded", willOpen ? "true" : "false"),
        );
    };

    const onOffcanvasClick = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest(".ct-toggle-close, [data-close]")) {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (t === offcanvas) {
        close();
        return;
      }

      const toggleBtn = t.closest<HTMLElement>(".ct-toggle-dropdown-mobile");
      if (toggleBtn && offcanvas?.contains(toggleBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const item = toggleBtn.closest<HTMLElement>(
          ".menu-item-has-children, [class*='children']",
        );
        if (!item) return;
        setMobileItemOpen(item, !item.classList.contains("dropdown-active"));
        return;
      }

      const link = t.closest("a");
      if (!link || !offcanvas?.contains(link)) return;

      const href = link.getAttribute("href") || "";
      if (href === "#" || href.startsWith("#")) {
        const item = link.closest<HTMLElement>(
          ".menu-item-has-children, [class*='children']",
        );
        if (item && item.querySelector(":scope > .sub-menu")) {
          e.preventDefault();
          e.stopPropagation();
          setMobileItemOpen(item, !item.classList.contains("dropdown-active"));
        }
        return;
      }

      close();
    };
    offcanvas?.addEventListener("click", onOffcanvasClick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && offcanvas?.classList.contains("is-open")) {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const mobileToggles = Array.from(
      document.querySelectorAll<HTMLElement>(
        "#offcanvas .ct-toggle-dropdown-mobile",
      ),
    );
    mobileToggles.forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("type", "button");
    });

    markActiveNav(window.location.pathname);

    const parents = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".ct-header .menu > .menu-item-has-children, .ct-header .menu .menu-item-has-children",
      ),
    ).filter((el) => !el.closest("#offcanvas"));

    const activate = (el: HTMLElement) => {
      el.classList.add("ct-active");
      const btn = el.querySelector<HTMLElement>(
        ".ct-toggle-dropdown-desktop-ghost, .ct-toggle-dropdown-desktop",
      );
      btn?.setAttribute("aria-expanded", "true");
    };
    const deactivate = (el: HTMLElement) => {
      el.classList.remove("ct-active");
      const btn = el.querySelector<HTMLElement>(
        ".ct-toggle-dropdown-desktop-ghost, .ct-toggle-dropdown-desktop",
      );
      btn?.setAttribute("aria-expanded", "false");
    };

    const cleanups: Array<() => void> = [];
    parents.forEach((el) => {
      const onEnter = () => activate(el);
      const onLeave = () => deactivate(el);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("focusin", onEnter);
      const onFocusOut = (e: FocusEvent) => {
        if (!el.contains(e.relatedTarget as Node | null)) {
          deactivate(el);
        }
      };
      el.addEventListener("focusout", onFocusOut);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("focusin", onEnter);
        el.removeEventListener("focusout", onFocusOut);
      });
    });

    // Blocksy sticky: fixed:shrink at top → yes:shrink when scrolled (row 100→90).
    // In-flow pages keep the sticky node in document flow via CSS (see header-blocksy-in).
    const header =
      document.getElementById("header") ||
      document.querySelector<HTMLElement>(".ct-header");
    const stickyNodes = Array.from(
      document.querySelectorAll<HTMLElement>("#header [data-sticky]"),
    );
    const stickyContainers = Array.from(
      document.querySelectorAll<HTMLElement>("#header .ct-sticky-container"),
    );
    const onScroll = () => {
      if (!header) return;
      const scrolled = window.scrollY > 8;
      header.classList.toggle("renacon-header-scrolled", scrolled);
      stickyNodes.forEach((el) => {
        el.setAttribute("data-sticky", scrolled ? "yes:shrink" : "fixed:shrink");
      });
      // Preserve layout height when Blocksy would take the sticky node out of flow
      stickyContainers.forEach((container) => {
        const row = container.querySelector<HTMLElement>('[data-row*="middle"]');
        const h = row?.offsetHeight || (window.innerWidth <= 999 ? 70 : 100);
        container.style.minHeight = `${h}px`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    // Homepage — exact renacon.in Blocksy look: do NOT wrap atmosphere bands
    // or apply scroll-reveal chrome. Hotspots still init below.
    // (wrapHomeBands / renacon-home-ix intentionally unused for visual parity)

    // About Us — exact renacon.in parity: in-flow header, no reveal chrome
    const aboutRoot = document.getElementById("post-4487");
    if (aboutRoot) {
      document.body.classList.add("renacon-page-about-us");
    }

    // Why Renacon — exact renacon.in parity: do not wrap scroll-reveal chrome
    // that restyles the benefit list, hero crop, or body copy.
    const whyRoot = document.getElementById("post-5659");
    if (whyRoot) {
      document.body.classList.add("renacon-page-why-renacon");
    }

    // Phase 5 hub pages — body classes for page-scoped sticky header chrome
    const careersRoot = document.getElementById("post-7899");
    if (careersRoot) {
      document.body.classList.add("renacon-page-careers");
    }
    const privacyRoot = document.getElementById("post-7264");
    if (privacyRoot) {
      document.body.classList.add("renacon-page-privacy");
    }
    const sitemapRoot = document.getElementById("post-5483");
    if (sitemapRoot) {
      document.body.classList.add("renacon-page-sitemap");
    }
    if (document.querySelector("main.gallery-hub")) {
      document.body.classList.add("renacon-page-gallery");
    }

    // Getwid image hotspots (tippy JS not shipped) — click + touch + hover
    cleanups.push(initGetwidHotspots());

    // Product pages — images + native accordion polish (no invent scroll-reveal)
    const productRoots = Array.from(
      document.querySelectorAll<HTMLElement>("article.renacon-product-page"),
    );
    productRoots.forEach((productRoot) => {
      hydrateWpImages(productRoot);
      initProductImagePolish(productRoot);
      initProductAccordions(productRoot, cleanups);
    });

    // Our Products hub — card hooks + Stackable button hover only (no invent reveal/lift)
    const productsHub =
      document.getElementById("post-635") ||
      document.querySelector<HTMLElement>("article.post-635, .page-id-635");
    if (productsHub || /\/our-products\/?$/.test(window.location.pathname)) {
      const root =
        productsHub ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-our-products-ix");
      root.setAttribute("data-renacon-products-ix", "products-hub-v3");
      document.body.classList.add("renacon-page-our-products");
      hydrateWpImages(root);

      // Mark top-level product columns as hub cards (layout hooks only)
      const cardRows = root.querySelectorAll<HTMLElement>(
        ".stk-6c7f365 > .stk-row, .stk-c602183 > .stk-row, .stk-6c7f365-column, .stk-c602183-column",
      );
      cardRows.forEach((row) => {
        row
          .querySelectorAll<HTMLElement>(":scope > .stk-block-column")
          .forEach((col) => col.classList.add("renacon-product-hub-card"));
      });
      if (!root.querySelector(".renacon-product-hub-card")) {
        [
          "9865a45",
          "7149e4e",
          "c5b65b7",
          "0eaf3ea",
          "a9ed25c",
          "2c836f6",
          "875bc77",
        ].forEach((id) => {
          root
            .querySelectorAll<HTMLElement>(`.stk-${id}`)
            .forEach((el) => el.classList.add("renacon-product-hub-card"));
        });
      }
    }

    // Projects / media gallery — lightbox viewer (never navigate to missing WP child pages)
    cleanups.push(initGalleryLightbox());

    // Projects-2 — gallery normalize + lightbox only (no invent scroll-reveal)
    const projectsGalleryRoot =
      document.getElementById("post-1192") ||
      document.querySelector<HTMLElement>(".page-id-1192, article.post-1192");
    if (projectsGalleryRoot || /\/projects-2\/?$/.test(window.location.pathname)) {
      const root =
        projectsGalleryRoot ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-projects-gallery-ix");
      root.setAttribute("data-renacon-gallery-ix", "projects-v1");
      document.body.classList.add("renacon-page-projects-2");
      document.querySelector("main.site-main")?.classList.add("renacon-projects-gallery-ix");
      hydrateWpImages(document.querySelector("main.site-main") || root);
      normalizeSimplyGalleries(document.querySelector("main.site-main") || root);
      clearGalleryMotionLocks(root);
    }

    // Media — Qubely tabs + gallery normalize (no invent scroll-reveal)
    const mediaRoot =
      document.getElementById("post-1067") ||
      document.querySelector<HTMLElement>(".page-id-1067, article.post-1067");
    if (mediaRoot || /\/media\/?$/.test(window.location.pathname)) {
      const root =
        mediaRoot ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-media-ix");
      root.setAttribute("data-renacon-gallery-ix", "media-v1");
      document.body.classList.add("renacon-page-media");
      document.querySelector("main.site-main")?.classList.add("renacon-media-ix");
      hydrateWpImages(document.querySelector("main.site-main") || root);
      normalizeSimplyGalleries(document.querySelector("main.site-main") || root);
      clearGalleryMotionLocks(root);
      sanitizeEmbedTitles(document.querySelector("main.site-main") || root);
      cleanups.push(initQubelyTabs(root));
    }

    // Contact page — Editor Plus tabs + field focus (no invent scroll-reveal)
    const contactRoot =
      document.getElementById("post-4301") ||
      document.querySelector<HTMLElement>(".page-id-4301, article.post-4301");
    if (contactRoot || /\/contact-us\/?$/.test(window.location.pathname)) {
      const root =
        contactRoot ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-contact-ix");
      root.setAttribute("data-renacon-contact-ix", "contact-premium-v1");
      document.body.classList.add("renacon-page-contact-us", "eplus_styles");
      hydrateWpImages(root);
      cleanups.push(initEditorPlusTabs(root));

      const fieldSelector =
        ".forminator-input, .forminator-textarea, select.forminator-select--field";
      const onFieldFocus = (e: Event) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (!t.matches(fieldSelector)) return;
        t.classList.add("renacon-field-focus");
      };
      const onFieldBlur = (e: Event) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        t.classList.remove("renacon-field-focus");
      };
      root.addEventListener("focusin", onFieldFocus);
      root.addEventListener("focusout", onFieldBlur);
      cleanups.push(() => {
        root.removeEventListener("focusin", onFieldFocus);
        root.removeEventListener("focusout", onFieldBlur);
      });
    }

    // Calculator — Involve.me embeds + native accordion polish
    const calculatorRoot =
      document.getElementById("post-6793") ||
      document.querySelector<HTMLElement>("article.post-6793, .page-id-6793");
    if (calculatorRoot || /\/calculator\/?$/.test(window.location.pathname)) {
      const root =
        calculatorRoot ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-calculator-ix");
      root.setAttribute("data-renacon-calc-ix", "calculator-v1");
      document.body.classList.add("renacon-page-calculator", "stk--anim-init");
      initProductAccordions(root, cleanups);
    }

    // News pages — ensure mirrored media URLs resolve
    if (
      document.querySelector(".news-index, article.post.type-post") ||
      /\/news\//.test(window.location.pathname)
    ) {
      hydrateWpImages(document.body);
      const newsRoot =
        document.querySelector<HTMLElement>(".news-index, article.post.type-post") ||
        document.body;
      newsRoot.classList.add("renacon-news-ix");
    }

    // Global belt-and-suspenders for mirrored media URLs / lazy attrs
    hydrateWpImages(document.body);

    return () => {
      openers.forEach((el) => el.removeEventListener("click", onOpenerClick));
      offcanvas?.removeEventListener("click", onOffcanvasClick);
      document.removeEventListener("keydown", onKeyDown);
      cleanups.forEach((fn) => fn());
      document.documentElement.classList.remove("ct-panel-open");
      document.body.style.overflow = "";
      header?.classList.remove("renacon-header-scrolled");
    };
  }, []);

  return null;
}

type HotspotPoint = {
  link?: string;
  title?: string;
  content?: string;
  placement?: string;
  popUpWidth?: string;
  newTab?: boolean;
};

function parseHotspotPoints(raw: string | null): HotspotPoint[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HotspotPoint[]) : [];
  } catch {
    return [];
  }
}

function buildHotspotTooltipHtml(point: HotspotPoint, fallbackTitle: string, fallbackHref: string): string {
  const title = (point.title || fallbackTitle || "Learn more").trim();
  const href = (point.link || fallbackHref || "#").trim() || "#";
  const content = (point.content || "").trim();
  const target = point.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
  const titleHtml = href && href !== "#"
    ? `<a class="wp-block-getwid-image-hotspot__tooltip-link" href="${href}"${target}>${title}</a>`
    : `<span>${title}</span>`;
  const contentHtml = content
    ? `<div class="wp-block-getwid-image-hotspot__tooltip-content">${content}</div>`
    : "";
  return `<div class="wp-block-getwid-image-hotspot__tooltip"><div class="wp-block-getwid-image-hotspot__tooltip-title">${titleHtml}</div>${contentHtml}<a class="renacon-hotspot-cta" href="${href}"${target}>View product</a></div>`;
}

/**
 * Move iframe title → aria-label so native browser title tooltips
 * don't stick over the VIDEOS row (seen as a grey floating title box).
 */
function sanitizeEmbedTitles(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLIFrameElement>("iframe[title]").forEach((iframe) => {
    const label = iframe.getAttribute("title")?.trim();
    if (!label) return;
    if (!iframe.getAttribute("aria-label")) {
      iframe.setAttribute("aria-label", label);
    }
    iframe.removeAttribute("title");
  });
}

const qubelyAbortByRoot = new WeakMap<HTMLElement, AbortController>();

/** Qubely tabs (media page Recent Events / Media) — plugin JS not shipped. */
function initQubelyTabs(scope: ParentNode = document): () => void {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>(".qubely-block-tab"),
  );
  if (!roots.length) return () => undefined;

  const cleanups: Array<() => void> = [];

  roots.forEach((root) => {
    qubelyAbortByRoot.get(root)?.abort();
    const ac = new AbortController();
    qubelyAbortByRoot.set(root, ac);

    root.dataset.renaconQubelyReady = "1";
    root.classList.add("renacon-qubely-tabs");

    const items = Array.from(
      root.querySelectorAll<HTMLElement>(".qubely-tab-nav > .qubely-tab-item"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(
        ":scope > .qubely-tab-body > .qubely-tab-content, .qubely-tab-body > .qubely-tab-content",
      ),
    );
    if (!items.length || !panels.length) return;

    const nav = root.querySelector<HTMLElement>(".qubely-tab-nav");
    nav?.setAttribute("role", "tablist");

    const activate = (index: number) => {
      items.forEach((item, i) => {
        const on = i === index;
        item.classList.toggle("qubely-active", on);
        item.classList.toggle("renacon-tab-active", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        const on = i === index;
        panel.classList.toggle("qubely-active", on);
        panel.classList.toggle("renacon-tab-panel-in", on);
        panel.style.setProperty("display", on ? "block" : "none", "important");
        panel.setAttribute("aria-hidden", on ? "false" : "true");
      });
    };

    const onClick = (e: Event) => {
      const t = e.target as HTMLElement | null;
      const item = t?.closest<HTMLElement>(".qubely-tab-nav > .qubely-tab-item");
      if (!item || !root.contains(item)) return;
      e.preventDefault();
      const index = items.indexOf(item);
      if (index < 0) return;
      activate(index);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const item = t?.closest<HTMLElement>(".qubely-tab-nav > .qubely-tab-item");
      if (!item || !root.contains(item)) return;
      const index = items.indexOf(item);
      if (index < 0) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate(index);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (index + dir + items.length) % items.length;
        activate(next);
        items[next]?.focus();
      }
    };

    items.forEach((item) => {
      item.setAttribute("role", "tab");
      item.tabIndex = 0;
    });

    root.addEventListener("click", onClick, { signal: ac.signal });
    root.addEventListener("keydown", onKey, { signal: ac.signal });
    cleanups.push(() => {
      ac.abort();
      delete root.dataset.renaconQubelyReady;
      qubelyAbortByRoot.delete(root);
    });

    activate(
      (() => {
        const initial = items.findIndex((el) =>
          el.classList.contains("qubely-active"),
        );
        return initial >= 0 ? initial : 0;
      })(),
    );
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Editor Plus tabs (contact forms) — WP plugin JS is not shipped. */
function initEditorPlusTabs(scope: ParentNode = document): () => void {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>(".ep_tabs_root, .wp-block-ep-tabs .ep_tabs_root"),
  );
  if (!roots.length) return () => undefined;

  const cleanups: Array<() => void> = [];

  roots.forEach((root) => {
    root.dataset.renaconTabsReady = "1";
    root.classList.add("renacon-ep-tabs");

    const labels = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(".ep_tabs_header > a.ep_label_main"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > .ep_tabs_wrapper > .ep_tab_item_wrapper"),
    );
    if (!labels.length || !panels.length) return;

    const activate = (index: number) => {
      labels.forEach((label, i) => {
        label.classList.toggle("ep_active_tab", i === index);
        label.setAttribute("aria-selected", i === index ? "true" : "false");
        label.setAttribute("tabindex", i === index ? "0" : "-1");
      });
      panels.forEach((panel, i) => {
        const on = i === index;
        panel.classList.toggle("ep_active_tab", on);
        panel.hidden = !on;
        panel.style.setProperty("display", on ? "block" : "none", "important");
        panel.querySelectorAll<HTMLElement>("form").forEach((form) => {
          // Forminator mirrors ship with inline display:none — force visible when tab is active
          if (on) {
            form.style.removeProperty("display");
            form.style.setProperty("display", "block", "important");
            form.removeAttribute("hidden");
          } else {
            form.style.setProperty("display", "none", "important");
          }
        });
      });
    };

    labels.forEach((label, index) => {
      label.setAttribute("role", "tab");
      label.setAttribute("href", label.getAttribute("href") || `#tab-${index}`);
      const onClick = (e: Event) => {
        e.preventDefault();
        activate(index);
      };
      label.addEventListener("click", onClick);
      cleanups.push(() => label.removeEventListener("click", onClick));
    });

    panels.forEach((panel) => panel.setAttribute("role", "tabpanel"));
    activate(0);
    cleanups.push(() => {
      delete root.dataset.renaconTabsReady;
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Pick largest URL from an img srcset, falling back to src. */
function largestImageUrl(img: HTMLImageElement): string {
  const srcset = img.getAttribute("srcset") || "";
  let best = img.currentSrc || img.getAttribute("src") || "";
  let bestW = 0;
  srcset.split(",").forEach((part) => {
    const bits = part.trim().split(/\s+/);
    const url = bits[0];
    if (!url) return;
    const wMatch = bits[1]?.match(/^(\d+)w$/);
    const w = wMatch ? Number(wMatch[1]) : 0;
    if (w >= bestW) {
      bestW = w;
      best = url;
    }
  });
  return localizeWpUrl(best);
}

/**
 * Simply Gallery plugin relies on absolute masonry. Without its JS, leftover
 * positioning can leave sparse rows left-aligned and hide captions. Normalize
 * to a plain flow/grid and fill blank captions from the linked slug.
 */
function normalizeSimplyGalleries(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".simply-gallery-amp, .pgc_sgb_slider").forEach((wrap) => {
    wrap.style.maxWidth = "1180px";
    wrap.style.width = "100%";
    wrap.style.marginLeft = "auto";
    wrap.style.marginRight = "auto";
    wrap.style.float = "none";
    wrap.style.transform = "none";
  });

  root.querySelectorAll<HTMLElement>(".sgb-gallery").forEach((gallery) => {
    gallery.style.height = "auto";
    gallery.style.position = "relative";
    gallery.querySelectorAll<HTMLElement>(".sgb-item").forEach((item) => {
      item.style.position = "relative";
      item.style.left = "auto";
      item.style.top = "auto";
      item.style.width = "100%";
      item.style.height = "auto";
      item.style.maxWidth = "none";
      // Leave transform/opacity clear so CSS hover + lightbox can run

      let caption = item.querySelector<HTMLElement>(".sgb-item-caption");
      const captionText = caption?.textContent?.replace(/\s+/g, " ").trim() || "";
      if (!caption) {
        caption = document.createElement("div");
        caption.className = "sgb-item-caption";
        item.appendChild(caption);
      }
      if (!captionText) {
        const href =
          item.querySelector("a")?.getAttribute("href") ||
          item.querySelector("img")?.getAttribute("src") ||
          "";
        const slug = href.split("/").filter(Boolean).pop() || "";
        const label = slug
          .replace(/\.[a-z0-9]+$/i, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();
        if (label) caption.textContent = label;
      }
      caption.style.display = "block";
      caption.style.position = "relative";
      caption.style.opacity = "1";
      caption.style.visibility = "visible";
    });
  });
}


/** Remove masonry leftover locks that would block gallery hover/lightbox. */
function clearGalleryMotionLocks(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".sgb-item").forEach((item) => {
    item.style.removeProperty("transform");
    item.style.removeProperty("opacity");
    item.style.removeProperty("visibility");
  });
}

/**
 * Simply Gallery items link to missing WP child pages (/projects-2/slug/).
 * Intercept click/touch and open a lightbox with the full image instead.
 */
function initGalleryLightbox(): () => void {
  const items = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(
      ".sgb-item > a, .simply-gallery-amp .sgb-item a, .pgc_sgb_slider .sgb-item a",
    ),
  );
  if (!items.length) return () => undefined;

  const cleanups: Array<() => void> = [];
  let overlay: HTMLElement | null = null;

  const close = () => {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    const node = overlay;
    const delay = prefersReducedMotion() ? 0 : 180;
    window.setTimeout(() => {
      node.remove();
      if (overlay === node) overlay = null;
    }, delay);
  };

  const open = (src: string, caption: string) => {
    close();
    const safeCaption = caption
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    overlay = document.createElement("div");
    overlay.className = "renacon-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", caption || "Project image");
    overlay.innerHTML = `
      <button type="button" class="renacon-lightbox-close" aria-label="Close">&times;</button>
      <figure class="renacon-lightbox-figure">
        <img class="renacon-lightbox-img" alt="${safeCaption}" />
        ${safeCaption ? `<figcaption class="renacon-lightbox-caption">${safeCaption}</figcaption>` : ""}
      </figure>
    `;
    const img = overlay.querySelector<HTMLImageElement>(".renacon-lightbox-img");
    if (img) {
      img.src = src;
      img.decoding = "async";
    }
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay?.classList.add("is-open"));

    const onCloseClick = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (
        t?.classList.contains("renacon-lightbox") ||
        t?.closest(".renacon-lightbox-close")
      ) {
        e.preventDefault();
        close();
      }
    };
    overlay.addEventListener("click", onCloseClick);
    cleanups.push(() => overlay?.removeEventListener("click", onCloseClick));
  };

  items.forEach((anchor) => {
    const item = anchor.closest<HTMLElement>(".sgb-item");
    item?.classList.add("renacon-gallery-item");
    anchor.classList.add("renacon-gallery-trigger");
    anchor.setAttribute("role", "button");
    anchor.setAttribute("aria-haspopup", "dialog");

    const onActivate = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const img = anchor.querySelector<HTMLImageElement>("img");
      if (!img) return;
      const caption =
        item
          ?.querySelector(".sgb-item-caption")
          ?.textContent?.replace(/\u00a0/g, " ")
          .trim() ||
        img.getAttribute("alt") ||
        "";
      open(largestImageUrl(img), caption);
    };

    const supportsPointer = typeof window.PointerEvent !== "undefined";
    if (supportsPointer) {
      let lastTs = 0;
      const onPointerUp = (e: Event) => {
        lastTs = Date.now();
        onActivate(e);
      };
      const suppressGhost = (e: Event) => {
        if (Date.now() - lastTs < 500) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      anchor.addEventListener("pointerup", onPointerUp);
      anchor.addEventListener("click", suppressGhost);
      cleanups.push(() => {
        anchor.removeEventListener("pointerup", onPointerUp);
        anchor.removeEventListener("click", suppressGhost);
      });
    } else {
      anchor.addEventListener("click", onActivate);
      cleanups.push(() => anchor.removeEventListener("click", onActivate));
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(e);
      }
    };
    anchor.addEventListener("keydown", onKey);
    cleanups.push(() => anchor.removeEventListener("keydown", onKey));
  });

  const onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && overlay) close();
  };
  document.addEventListener("keydown", onDocKey);
  cleanups.push(() => document.removeEventListener("keydown", onDocKey));

  return () => {
    close();
    cleanups.forEach((fn) => fn());
  };
}

function initGetwidHotspots(): () => void {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>(".wp-block-getwid-image-hotspot"),
  );
  if (!roots.length) return () => undefined;

  const cleanups: Array<() => void> = [];
  let openTip: HTMLElement | null = null;

  const closeOpen = () => {
    if (!openTip) return;
    openTip.classList.remove("is-open", "renacon-hotspot-open");
    openTip.querySelector<HTMLElement>(".renacon-hotspot-tip")?.setAttribute("hidden", "");
    openTip.setAttribute("aria-expanded", "false");
    openTip = null;
  };

  roots.forEach((root) => {
    const points = parseHotspotPoints(root.getAttribute("data-image-points"));
    const trigger = (root.getAttribute("data-trigger") || "hover").toLowerCase();
    const dots = Array.from(
      root.querySelectorAll<HTMLElement>(".wp-block-getwid-image-hotspot__dot"),
    );

    dots.forEach((dot, index) => {
      if (dot.dataset.renaconHotspotReady === "1") return;
      dot.dataset.renaconHotspotReady = "1";
      dot.classList.add("is-visible", "renacon-hotspot-dot");
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-expanded", "false");

      const point = points[index] || {};
      const titleEl = dot.querySelector<HTMLAnchorElement>(
        ".wp-block-getwid-image-hotspot__dot-title a",
      );
      const fallbackTitle =
        titleEl?.textContent?.replace(/\u00a0/g, " ").trim() ||
        point.title ||
        `Hotspot ${index + 1}`;
      const fallbackHref = titleEl?.getAttribute("href") || point.link || "#";
      dot.setAttribute("aria-label", fallbackTitle);

      // Ensure a visible + marker when Font Awesome is unavailable
      const icon = dot.querySelector<HTMLElement>(".wp-block-getwid-image-hotspot__dot-icon");
      if (icon && !icon.textContent?.trim()) {
        icon.setAttribute("data-renacon-plus", "1");
      }

      let tip = dot.querySelector<HTMLElement>(".renacon-hotspot-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.className = "renacon-hotspot-tip tippy-popper";
        tip.setAttribute("hidden", "");
        tip.innerHTML = buildHotspotTooltipHtml(point, fallbackTitle, fallbackHref);
        const placement = (point.placement || "top").toLowerCase();
        tip.dataset.placement = placement;
        tip.style.setProperty("--renacon-tip-width", `${point.popUpWidth || 200}px`);
        dot.appendChild(tip);
      }

      const open = () => {
        if (openTip && openTip !== dot) closeOpen();
        tip?.removeAttribute("hidden");
        dot.classList.add("is-open", "renacon-hotspot-open");
        dot.setAttribute("aria-expanded", "true");
        openTip = dot;
      };

      const toggle = () => {
        if (dot.classList.contains("is-open")) closeOpen();
        else open();
      };

      const onActivate = (e: Event) => {
        // Let clicks on links inside the tip navigate normally
        const target = e.target as HTMLElement | null;
        if (target?.closest("a.renacon-hotspot-cta, a.wp-block-getwid-image-hotspot__tooltip-link")) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        toggle();
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        } else if (e.key === "Escape") {
          closeOpen();
        }
      };

      // Prefer pointerup (mouse + touch) so we don't double-toggle with a follow-up click
      const supportsPointer = typeof window.PointerEvent !== "undefined";
      if (supportsPointer) {
        let lastPointerTs = 0;
        const onPointerUp = (e: Event) => {
          const target = e.target as HTMLElement | null;
          // Allow real link navigation inside the tip
          if (target?.closest("a.renacon-hotspot-cta, a.wp-block-getwid-image-hotspot__tooltip-link")) {
            return;
          }
          lastPointerTs = Date.now();
          onActivate(e);
        };
        const suppressGhostClick = (e: Event) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest("a.renacon-hotspot-cta, a.wp-block-getwid-image-hotspot__tooltip-link")) {
            return;
          }
          if (Date.now() - lastPointerTs < 500) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        dot.addEventListener("pointerup", onPointerUp);
        dot.addEventListener("click", suppressGhostClick);
        cleanups.push(() => {
          dot.removeEventListener("pointerup", onPointerUp);
          dot.removeEventListener("click", suppressGhostClick);
        });
      } else {
        dot.addEventListener("click", onActivate);
        cleanups.push(() => dot.removeEventListener("click", onActivate));
      }
      dot.addEventListener("keydown", onKey);
      cleanups.push(() => {
        dot.removeEventListener("keydown", onKey);
      });

      // Desktop hover when original trigger is hover
      if (trigger === "hover") {
        const onEnter = () => open();
        const onLeave = () => {
          // Delay close so user can move into tip
          window.setTimeout(() => {
            if (!dot.matches(":hover") && !tip?.matches(":hover")) {
              if (openTip === dot) closeOpen();
            }
          }, 160);
        };
        dot.addEventListener("mouseenter", onEnter);
        dot.addEventListener("mouseleave", onLeave);
        tip?.addEventListener("mouseenter", onEnter);
        tip?.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          dot.removeEventListener("mouseenter", onEnter);
          dot.removeEventListener("mouseleave", onLeave);
          tip?.removeEventListener("mouseenter", onEnter);
          tip?.removeEventListener("mouseleave", onLeave);
        });
      }
    });
  });

  const onDocPointer = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest(".wp-block-getwid-image-hotspot__dot")) {
      closeOpen();
    }
  };
  document.addEventListener("pointerdown", onDocPointer);
  cleanups.push(() => document.removeEventListener("pointerdown", onDocPointer));

  return () => {
    closeOpen();
    cleanups.forEach((fn) => fn());
  };
}
