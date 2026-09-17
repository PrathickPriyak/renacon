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
