"use client";

import { useEffect } from "react";

const IX_MARKER = "renacon-ix-v2";
const IX_ATTR = "v2-sep2026";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function dedupeNested(candidates: HTMLElement[]): HTMLElement[] {
  return candidates.filter(
    (el) => !candidates.some((other) => other !== el && other.contains(el)),
  );
}

function observeReveals(
  revealEls: HTMLElement[],
  reduceMotion: boolean,
  cleanups: Array<() => void>,
): void {
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
    return;
  }

  if (typeof IntersectionObserver === "undefined") {
    revealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add("renacon-reveal-in");
        io.unobserve(el);
      });
    },
    { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );

  revealEls.forEach((el) => io.observe(el));
  cleanups.push(() => io.disconnect());
}

function initPageInteractions(
  root: HTMLElement,
  options: {
    revealSelector: string;
    heroSelectors: string[];
    benefitListSelector?: string;
    benefitsInClass?: string;
  },
  cleanups: Array<() => void>,
): void {
  root.classList.add(IX_MARKER);
  root.setAttribute("data-renacon-ix", IX_ATTR);

  const reduceMotion = prefersReducedMotion();

  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(options.revealSelector),
  ).filter((el) => {
    if (el.classList.contains("renacon-reveal")) return false;
    if (el.classList.contains("wp-block-spacer")) return false;
    return true;
  });

  const revealEls = dedupeNested(candidates);
  revealEls.forEach((el, i) => {
    el.classList.add("renacon-reveal");
    el.style.setProperty(
      "--renacon-reveal-delay",
      `${Math.min(i * 55, 360)}ms`,
    );
  });
  observeReveals(revealEls, reduceMotion, cleanups);

  // Staggered hero / title entrance (always visible on load)
  const heroPieces: HTMLElement[] = [];
  options.heroSelectors.forEach((sel) => {
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (!heroPieces.includes(el)) heroPieces.push(el);
    });
  });

  heroPieces.forEach((el, i) => {
    el.classList.add("renacon-hero-piece");
    el.style.setProperty("--renacon-hero-delay", `${80 + i * 110}ms`);
  });

  const runHero = () => root.classList.add("renacon-hero-in");
  if (reduceMotion) {
    runHero();
  } else {
    const t = window.setTimeout(runHero, 60);
    cleanups.push(() => window.clearTimeout(t));
  }

  if (options.benefitListSelector && options.benefitsInClass) {
    const items = Array.from(
      root.querySelectorAll<HTMLElement>(`${options.benefitListSelector} > li`),
    );
    items.forEach((li, i) => {
      li.classList.add("renacon-why-benefit");
      li.style.setProperty("--renacon-benefit-delay", `${120 + i * 90}ms`);
      li.tabIndex = 0;
    });

    const markBenefitsIn = () => root.classList.add(options.benefitsInClass!);

    if (reduceMotion) {
      markBenefitsIn();
    } else if (typeof IntersectionObserver !== "undefined") {
      const list =
        root.querySelector<HTMLElement>(options.benefitListSelector) || root;
      const bio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markBenefitsIn();
            bio.disconnect();
          });
        },
        { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
      );
      bio.observe(list);
      cleanups.push(() => bio.disconnect());
    } else {
      markBenefitsIn();
    }
  }
}


const WP_ORIGIN = "https://renacon.in";

function absolutizeWpUrl(url: string): string {
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

/** Fix relative / lazy WordPress media so product images actually paint. */
function hydrateWpImages(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const lazy =
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy-src") ||
      img.getAttribute("data-original");
    const current = img.getAttribute("src") || "";
    if (lazy && (!current || current.startsWith("data:"))) {
      img.setAttribute("src", absolutizeWpUrl(lazy));
    } else if (current) {
      const abs = absolutizeWpUrl(current);
      if (abs !== current) img.setAttribute("src", abs);
    }

    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const next = srcset.replace(
        /(^|,\s*)(\/wp-content\/|\/wp-includes\/)/g,
        (_m, sep: string, path: string) => `${sep}${WP_ORIGIN}${path}`,
      );
      if (next !== srcset) img.setAttribute("srcset", next);
    }
  });

  root.querySelectorAll<HTMLElement>("[style*='wp-content'], [style*='background']").forEach(
    (el) => {
      const style = el.getAttribute("style");
      if (!style || !style.includes("/wp-content/")) return;
      el.setAttribute(
        "style",
        style.replace(
          /url\(\s*(['"]?)\/(wp-content|wp-includes)\//g,
          `url($1${WP_ORIGIN}/$2/`,
        ),
      );
    },
  );
}

function initProductImagePolish(
  root: HTMLElement,
  cleanups: Array<() => void>,
): void {
  root.classList.add("renacon-product-ix");

  const figures = Array.from(
    root.querySelectorAll<HTMLElement>(
      ".wp-block-image, .stk-block-background, .stk-block-image, .wp-block-getwid-image-box",
    ),
  );
  figures.forEach((fig) => fig.classList.add("renacon-product-media"));

  const photoCols = Array.from(
    root.querySelectorAll<HTMLElement>(
      ".stk-block-background.stk--has-background-overlay",
    ),
  );
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    photoCols.forEach((el) => el.classList.add("renacon-product-photo-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        el.classList.toggle("renacon-product-photo-in", entry.isIntersecting);
      });
    },
    { threshold: 0.2 },
  );
  photoCols.forEach((el) => io.observe(el));
  cleanups.push(() => io.disconnect());
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

function classifyHomeChild(el: HTMLElement): string | null {
  if (
    el.classList.contains("stk-52d755f") ||
    el.querySelector(".wp-block-getwid-section")
  ) {
    return "hero";
  }
  if (el.classList.contains("eplus-styles-uid-2b8c9e")) {
    return "highlights";
  }
  if (
    el.classList.contains("stk-d11fa5b") ||
    el.classList.contains("eplus-styles-uid-afaa2e") ||
    el.classList.contains("eplus-styles-uid-5b3f17") ||
    (el.classList.contains("wp-block-image") &&
      !!el.querySelector('img[src*="brickwall"]')) ||
    (el.classList.contains("wp-block-group") &&
      el.classList.contains("alignfull") &&
      !el.textContent?.trim())
  ) {
    return "products";
  }
  if (
    el.classList.contains("stk-ee3acf8") ||
    (el.matches("h1.wp-block-heading") &&
      /our services/i.test(el.textContent || ""))
  ) {
    return "services";
  }
  if (el.classList.contains("wp-block-getwid-image-hotspot")) {
    return "hotspot";
  }
  if (
    el.classList.contains("stk-70b1ef1") ||
    (el.matches("h1.wp-block-heading") &&
      /project/i.test(el.textContent || "")) ||
    (el.classList.contains("wp-block-image") &&
      !!el.querySelector('img[src*="design-1"]')) ||
    (el.matches("p") && /sustainable projects/i.test(el.textContent || ""))
  ) {
    return "projects";
  }
  return null;
}

/** Groups homepage blocks into full-bleed atmosphere bands (DOM-only). */
function wrapHomeBands(
  root: HTMLElement,
  cleanups: Array<() => void>,
): void {
  const content = root.querySelector<HTMLElement>(".entry-content");
  if (!content || content.dataset.renaconBands === "1") return;
  content.dataset.renaconBands = "1";

  const children = Array.from(content.children).filter(
    (n): n is HTMLElement => n instanceof HTMLElement,
  );

  interface HomeBand {
    name: string;
    els: HTMLElement[];
  }

  const bands: HomeBand[] = [];
  let activeBand: HomeBand | null = null;

  for (const el of children) {
    const kind = classifyHomeChild(el);
    if (kind) {
      if (!activeBand || activeBand.name !== kind) {
        if (activeBand && activeBand.els.length > 0) {
          bands.push(activeBand);
        }
        activeBand = { name: kind, els: [] };
      }
      activeBand.els.push(el);
      continue;
    }
    if (activeBand) {
      activeBand.els.push(el);
    }
  }
  if (activeBand && activeBand.els.length > 0) {
    bands.push(activeBand);
  }

  const wrappers: HTMLElement[] = [];
  for (const band of bands) {
    if (band.els.length === 0) continue;
    const first = band.els[0];
    if (!first) continue;
    const wrap = document.createElement("div");
    wrap.className = `renacon-home-band renacon-home-band--${band.name}`;
    wrap.setAttribute("data-renacon-band", band.name);
    wrap.setAttribute("data-renacon-home", "bg-only");
    // Force vertical page flow — prevent mirror CSS from flexing bands sideways
    wrap.style.display = "block";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "none";
    wrap.style.clear = "both";
    wrap.style.float = "none";
    first.before(wrap);
    band.els.forEach((node) => wrap.appendChild(node));
    wrappers.push(wrap);
  }

  cleanups.push(() => {
    wrappers.forEach((wrap) => {
      const parent = wrap.parentElement;
      if (!parent) return;
      while (wrap.firstChild) {
        parent.insertBefore(wrap.firstChild, wrap);
      }
      wrap.remove();
    });
    delete content.dataset.renaconBands;
  });
}

/** Enables Blocksy mobile menu and desktop dropdowns without WordPress JS. */
export function WpInteractions() {
  useEffect(() => {
    const offcanvas = document.getElementById("offcanvas");

    const openers = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-toggle-panel="#offcanvas"], .ct-header-trigger, button[aria-label*="menu" i], .ct-toggle-button',
      ),
    );

    const open = () => {
      if (!offcanvas) return;
      offcanvas.classList.add("is-open", "active");
      offcanvas.removeAttribute("inert");
      document.documentElement.classList.add("ct-panel-open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      if (!offcanvas) return;
      offcanvas.classList.remove("is-open", "active");
      offcanvas.setAttribute("inert", "");
      document.documentElement.classList.remove("ct-panel-open");
      document.body.style.overflow = "";
    };

    const onOpenerClick = (e: Event) => {
      e.preventDefault();
      if (!offcanvas) return;
      if (offcanvas.classList.contains("is-open")) close();
      else open();
    };

    openers.forEach((el) => el.addEventListener("click", onOpenerClick));

    const onOffcanvasClick = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest(".ct-toggle-close, [data-close]")) {
        e.preventDefault();
        close();
        return;
      }
      if (t === offcanvas) {
        close();
        return;
      }
      const link = t.closest("a");
      if (link && !link.getAttribute("href")?.startsWith("#")) {
        close();
      }
    };
    offcanvas?.addEventListener("click", onOffcanvasClick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && offcanvas?.classList.contains("is-open")) {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const mobileToggles = Array.from(
      document.querySelectorAll<HTMLElement>(".ct-toggle-dropdown-mobile"),
    );

    const onMobileToggle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget as HTMLElement;
      const item = btn.closest<HTMLElement>(
        ".menu-item-has-children, [class*='children']",
      );
      if (!item) return;
      const willOpen = !item.classList.contains("dropdown-active");
      const parentList = item.parentElement;
      if (parentList) {
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
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    };

    mobileToggles.forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", onMobileToggle);
    });

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

    const header =
      document.getElementById("header") ||
      document.querySelector<HTMLElement>(".ct-header");
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle("renacon-header-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    // Homepage — section bands + scroll reveals (do not touch header)
    const homeRoot = document.getElementById("post-2306");
    if (homeRoot) {
      homeRoot.classList.add("renacon-home-ix");
      wrapHomeBands(homeRoot, cleanups);
      initPageInteractions(
        homeRoot,
        {
          revealSelector: [
            ".renacon-home-band--highlights .wp-block-column",
            ".renacon-home-band--products > .wp-block-image",
            ".renacon-home-band--products h1.wp-block-heading",
            ".renacon-home-band--products .wp-block-getwid-image-box",
            ".renacon-home-band--services .stk-e01c6a5",
            ".renacon-home-band--services .stk-43533bb",
            ".renacon-home-band--services .stk-f0223a1",
            ".renacon-home-band--services .stk-e3c56a3",
            ".renacon-home-band--services .stk-92754a5",
            ".renacon-home-band--hotspot .wp-block-getwid-image-hotspot",
            ".renacon-home-band--projects > .wp-block-image",
            ".renacon-home-band--projects h1.wp-block-heading",
            ".renacon-home-band--projects > p",
            ".renacon-home-band--projects .stk-block-image-box",
          ].join(", "),
          heroSelectors: [
            ".renacon-home-band--hero .wp-block-getwid-section",
          ],
        },
        cleanups,
      );
    }

    // About Us — obvious scroll reveals + hero stagger
    const aboutRoot = document.getElementById("post-4487");
    if (aboutRoot) {
      initPageInteractions(
        aboutRoot,
        {
          revealSelector: [
            ".wp-block-media-text",
            ".entry-content > p",
            ".entry-content > h2",
            ".entry-content > h1",
            ".wp-block-stackable-columns",
            ".wp-block-getwid-image-box",
            ".wp-block-pullquote",
            ".wp-block-stackable-accordion",
            ".ugb-container",
            ".stk-block-column.stk-9ca72ed",
            ".stk-block-column.stk-b9aef73",
            ".stk-block-column.stk-ad91ac3",
          ].join(", "),
          heroSelectors: [
            ".wp-block-media-text .stk-block-heading",
            ".wp-block-media-text__media",
            ".entry-content > p:first-of-type",
          ],
        },
        cleanups,
      );
    }

    // Why Renacon — reveals, benefit stagger, hero zoom
    const whyRoot = document.getElementById("post-5659");
    if (whyRoot) {
      initPageInteractions(
        whyRoot,
        {
          revealSelector: [
            ".entry-content > .wp-block-image.alignfull",
            ".wp-block-stackable-columns",
            ".entry-content > h2",
            ".entry-content > p",
            ".wp-block-embed",
          ].join(", "),
          heroSelectors: [
            ".entry-content > .wp-block-image.alignfull:first-child",
            "h1.wp-block-heading",
            ".stk-72ab4ab .wp-block-image",
            ".stk-72ab4ab > .stk-column-wrapper > .stk-block-content > p",
          ],
          benefitListSelector: ".ep-custom-list",
          benefitsInClass: "renacon-why-benefits-in",
        },
        cleanups,
      );
    }

    // Getwid image hotspots (tippy JS not shipped) — click + touch + hover
    cleanups.push(initGetwidHotspots());

    // Product pages — images, accordion, CTA polish (all product slugs)
    const productRoots = Array.from(
      document.querySelectorAll<HTMLElement>("article.renacon-product-page"),
    );
    productRoots.forEach((productRoot) => {
      hydrateWpImages(productRoot);
      initPageInteractions(
        productRoot,
        {
          revealSelector: [
            ".entry-content > .wp-block-image",
            ".entry-content > p",
            ".entry-content > h1",
            ".entry-content > h2",
            ".entry-content > h3",
            ".wp-block-stackable-columns",
            ".wp-block-stackable-accordion",
            ".wp-block-image",
            ".ugb-container",
            ".wpforms-container",
          ].join(", "),
          heroSelectors: [
            ".entry-content > .wp-block-image.alignfull:first-child",
            ".entry-content > .wp-block-image:first-child",
            "h1.wp-block-heading",
            ".stk-block-heading",
          ],
        },
        cleanups,
      );
      initProductImagePolish(productRoot, cleanups);
      initProductAccordions(productRoot, cleanups);
    });

    // Our Products hub — scroll-reveal + card hover (page-scoped)
    const productsHub = document.getElementById("post-635");
    if (productsHub) {
      productsHub.classList.add("renacon-our-products-ix");
      hydrateWpImages(productsHub);
      initPageInteractions(
        productsHub,
        {
          revealSelector: [
            ".stk-block-image",
            ".stk-block-column",
            ".wp-block-stackable-columns",
            ".stk-block-heading",
            ".entry-content > .wp-block-image",
            ".entry-content > p",
            "a.stk-link",
          ].join(", "),
          heroSelectors: [
            ".entry-content > .wp-block-image.alignfull:first-child",
            ".entry-content > .wp-block-image:first-child",
            "h1.wp-block-heading",
            ".stk-block-heading",
          ],
        },
        cleanups,
      );
    }

    // Projects gallery — lightbox viewer (never navigate to missing WP child pages)
    cleanups.push(initGalleryLightbox());

    // Contact page — interactive form polish marker
    const contactRoot =
      document.getElementById("post-4301") ||
      document.querySelector<HTMLElement>(".page-id-4301, article.post-4301");
    if (contactRoot || /\/contact-us\/?$/.test(window.location.pathname)) {
      const root =
        contactRoot ||
        document.querySelector<HTMLElement>("main.site-main") ||
        document.body;
      root.classList.add("renacon-contact-ix");
      hydrateWpImages(root);
      cleanups.push(initEditorPlusTabs(root));
      initPageInteractions(
        root,
        {
          revealSelector: [
            ".forminator-custom-form",
            ".wp-block-columns",
            ".entry-content > p",
            ".entry-content > h1",
            ".entry-content > h2",
            ".wp-block-image",
            ".ep_tabs_wrapper",
          ].join(", "),
          heroSelectors: [
            ".entry-content > .wp-block-image:first-child",
            "h1.page-title",
            "h1.wp-block-heading",
          ],
        },
        cleanups,
      );
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
      mobileToggles.forEach((btn) =>
        btn.removeEventListener("click", onMobileToggle),
      );
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

/** Editor Plus tabs (contact forms) — WP plugin JS is not shipped. */
function initEditorPlusTabs(scope: ParentNode = document): () => void {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>(".ep_tabs_root, .wp-block-ep-tabs .ep_tabs_root"),
  );
  if (!roots.length) return () => undefined;

  const cleanups: Array<() => void> = [];

  roots.forEach((root) => {
    if (root.dataset.renaconTabsReady === "1") return;
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
      });
      panels.forEach((panel, i) => {
        const on = i === index;
        panel.classList.toggle("ep_active_tab", on);
        panel.style.display = on ? "block" : "none";
        // Forms inside inactive tabs may be display:none from theme CSS
        panel.querySelectorAll<HTMLElement>("form").forEach((form) => {
          form.style.display = on ? "" : "none";
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
  return absolutizeWpUrl(best);
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
    window.setTimeout(() => {
      node.remove();
      if (overlay === node) overlay = null;
    }, 180);
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
