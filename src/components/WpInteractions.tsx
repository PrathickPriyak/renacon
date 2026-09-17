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
    wrap.setAttribute("data-renacon-premium", "sep2026");
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
