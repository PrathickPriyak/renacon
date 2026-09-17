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
  if (el.classList.contains("stk-ee3acf8")) {
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
