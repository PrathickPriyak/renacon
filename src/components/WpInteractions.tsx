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
      offcanvas.classList.add("is-open");
      offcanvas.removeAttribute("inert");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      if (!offcanvas) return;
      offcanvas.classList.remove("is-open");
      offcanvas.setAttribute("inert", "");
      document.body.style.overflow = "";
    };

    const onClick = (e: Event) => {
      e.preventDefault();
      if (!offcanvas) return;
      if (offcanvas.classList.contains("is-open")) close();
      else open();
    };

    openers.forEach((el) => el.addEventListener("click", onClick));
    offcanvas?.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("a")) close();
      if (t.matches("#offcanvas") || t.closest("[data-close]")) close();
    });

    // Blocksy desktop dropdowns expect `.ct-active` on parents
    const parents = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".ct-header .menu > .menu-item-has-children, .ct-header .menu .menu-item-has-children",
      ),
    );

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
      el.addEventListener("focusout", (e) => {
        if (!el.contains((e as FocusEvent).relatedTarget as Node | null)) {
          deactivate(el);
        }
      });
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("focusin", onEnter);
      });
    });

    return () => {
      openers.forEach((el) => el.removeEventListener("click", onClick));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
