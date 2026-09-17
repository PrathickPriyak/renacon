"use client";

import { useEffect } from "react";

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
      // Close when tapping the backdrop (the panel itself, not inner content)
      if (t === offcanvas) {
        close();
        return;
      }
      // Follow links: close drawer after navigation intent
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

    // Mobile offcanvas accordion: Blocksy uses `.dropdown-active` on parents
    const mobileToggles = Array.from(
      document.querySelectorAll<HTMLElement>(".ct-toggle-dropdown-mobile"),
    );

    const onMobileToggle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget as HTMLElement;
      const item = btn.closest<HTMLElement>(".menu-item-has-children, [class*='children']");
      if (!item) return;
      const willOpen = !item.classList.contains("dropdown-active");
      // Accordion: close siblings at the same level
      const parentList = item.parentElement;
      if (parentList) {
        Array.from(parentList.children).forEach((sib) => {
          if (!(sib instanceof HTMLElement) || sib === item) return;
          if (sib.classList.contains("menu-item-has-children") || /children/.test(sib.className)) {
            sib.classList.remove("dropdown-active", "ct-active");
            sib
              .querySelectorAll<HTMLElement>(":scope > .ct-sub-menu-parent .ct-toggle-dropdown-mobile, :scope > a + .ct-toggle-dropdown-mobile")
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

    // Blocksy desktop dropdowns expect `.ct-active` on parents
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

    // Sticky header elevation after scroll (desktop + mobile)
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

    // About Us: scroll-reveal + soft image lift (CSS handles reduced-motion)
    const aboutRoot = document.getElementById("post-4487");
    if (aboutRoot) {
      aboutRoot.classList.add("renacon-about-interactive");
      const revealSelector = [
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
      ].join(", ");

      const candidates = Array.from(
        aboutRoot.querySelectorAll<HTMLElement>(revealSelector),
      ).filter((el) => {
        // Prefer leaf-ish blocks; skip nested duplicates already marked
        if (el.classList.contains("renacon-reveal")) return false;
        // Skip spacers / empty wrappers
        if (el.classList.contains("wp-block-spacer")) return false;
        return true;
      });

      // Deduplicate nested: if a parent is also a candidate, keep the parent only
      const revealEls = candidates.filter((el) => {
        return !candidates.some(
          (other) => other !== el && other.contains(el),
        );
      });

      revealEls.forEach((el, i) => {
        el.classList.add("renacon-reveal");
        el.style.setProperty("--renacon-reveal-delay", `${Math.min(i * 40, 280)}ms`);
      });

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        revealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
      } else if (typeof IntersectionObserver !== "undefined") {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target as HTMLElement;
              el.classList.add("renacon-reveal-in");
              io.unobserve(el);
            });
          },
          { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        );
        revealEls.forEach((el) => io.observe(el));
        cleanups.push(() => io.disconnect());
      } else {
        revealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
      }

      // Soft parallax-ish lift on hero / founder images while scrolling (very light)
      const mediaImgs = Array.from(
        aboutRoot.querySelectorAll<HTMLElement>(
          ".wp-block-media-text__media img, .wp-block-getwid-image-box__image",
        ),
      );
      if (!reduceMotion && mediaImgs.length) {
        let ticking = false;
        const onAboutScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            const mid = window.innerHeight * 0.5;
            mediaImgs.forEach((img) => {
              const rect = img.getBoundingClientRect();
              const delta = (rect.top + rect.height / 2 - mid) / window.innerHeight;
              const y = Math.max(-8, Math.min(8, delta * -12));
              img.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
            });
            ticking = false;
          });
        };
        onAboutScroll();
        window.addEventListener("scroll", onAboutScroll, { passive: true });
        cleanups.push(() => {
          window.removeEventListener("scroll", onAboutScroll);
          mediaImgs.forEach((img) => {
            img.style.transform = "";
          });
        });
      }
    }

    // Why Renacon: scroll-reveal + benefit list stagger (CSS handles reduced-motion)
    const whyRoot = document.getElementById("post-5659");
    if (whyRoot) {
      whyRoot.classList.add("renacon-why-interactive");

      const whyRevealSelector = [
        ".entry-content > .wp-block-image.alignfull",
        ".stk-block-columns.stk-8eed3ae",
        ".entry-content > h2",
        ".entry-content > p",
        ".wp-block-embed-youtube",
      ].join(", ");

      const whyCandidates = Array.from(
        whyRoot.querySelectorAll<HTMLElement>(whyRevealSelector),
      ).filter((el) => {
        if (el.classList.contains("renacon-reveal")) return false;
        if (el.classList.contains("wp-block-spacer")) return false;
        return true;
      });

      const whyRevealEls = whyCandidates.filter((el) => {
        return !whyCandidates.some(
          (other) => other !== el && other.contains(el),
        );
      });

      whyRevealEls.forEach((el, i) => {
        el.classList.add("renacon-reveal");
        el.style.setProperty(
          "--renacon-reveal-delay",
          `${Math.min(i * 45, 300)}ms`,
        );
      });

      const benefitItems = Array.from(
        whyRoot.querySelectorAll<HTMLElement>(".ep-custom-list > li"),
      );
      benefitItems.forEach((li, i) => {
        li.classList.add("renacon-why-benefit");
        li.style.setProperty("--renacon-benefit-delay", `${80 + i * 55}ms`);
        if (!li.hasAttribute("tabindex")) li.setAttribute("tabindex", "0");
      });

      const whyReduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const markBenefitsIn = () => {
        whyRoot.classList.add("renacon-why-benefits-in");
      };

      if (whyReduceMotion) {
        whyRevealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
        markBenefitsIn();
      } else if (typeof IntersectionObserver !== "undefined") {
        const whyIo = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target as HTMLElement;
              el.classList.add("renacon-reveal-in");
              if (
                el.classList.contains("stk-8eed3ae") ||
                el.querySelector(".ep-custom-list")
              ) {
                markBenefitsIn();
              }
              whyIo.unobserve(el);
            });
          },
          { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        );
        whyRevealEls.forEach((el) => whyIo.observe(el));
        cleanups.push(() => whyIo.disconnect());

        // If columns already in view on load, still stagger benefits
        const cols = whyRoot.querySelector(".stk-8eed3ae");
        if (cols) {
          const rect = cols.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.92) {
            // observer will fire; benefits gated on reveal class via CSS sibling path too
          }
        }
      } else {
        whyRevealEls.forEach((el) => el.classList.add("renacon-reveal-in"));
        markBenefitsIn();
      }
    }

    return () => {
      openers.forEach((el) => el.removeEventListener("click", onOpenerClick));
      offcanvas?.removeEventListener("click", onOffcanvasClick);
      document.removeEventListener("keydown", onKeyDown);
      mobileToggles.forEach((btn) => btn.removeEventListener("click", onMobileToggle));
      cleanups.forEach((fn) => fn());
      document.documentElement.classList.remove("ct-panel-open");
      document.body.style.overflow = "";
      header?.classList.remove("renacon-header-scrolled");
    };
  }, []);

  return null;
}
