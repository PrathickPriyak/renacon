"use client";

import { useEffect } from "react";

/** Enables Blocksy mobile menu without loading WordPress JS. */
export function WpInteractions() {
  useEffect(() => {
    const offcanvas = document.getElementById("offcanvas");
    if (!offcanvas) return;

    const openers = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-toggle-panel="#offcanvas"], .ct-header-trigger, button[aria-label*="menu" i], .ct-toggle-button',
      ),
    );

    const open = () => {
      offcanvas.classList.add("is-open");
      offcanvas.removeAttribute("inert");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      offcanvas.classList.remove("is-open");
      offcanvas.setAttribute("inert", "");
      document.body.style.overflow = "";
    };

    const onClick = (e: Event) => {
      e.preventDefault();
      if (offcanvas.classList.contains("is-open")) close();
      else open();
    };

    openers.forEach((el) => el.addEventListener("click", onClick));
    offcanvas.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("a")) close();
      if (t.matches("#offcanvas") || t.closest("[data-close]")) close();
    });

    return () => {
      openers.forEach((el) => el.removeEventListener("click", onClick));
    };
  }, []);

  return null;
}
