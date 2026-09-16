"use client";

import { useEffect } from "react";

/**
 * Makes mirrored Forminator / brochure forms post to our local APIs
 * so the WordPress UI keeps working without WP admin.
 */
export function FormBridge() {
  useEffect(() => {
    const onSubmit = async (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const action = (form.getAttribute("action") || "").toLowerCase();
      const isWpForm =
        form.className.includes("forminator") ||
        form.className.includes("wpforms") ||
        action.includes("admin-ajax") ||
        form.closest(".forminator-ui, .wpforms-container, .stk-block");
      if (!isWpForm) return;

      event.preventDefault();
      event.stopPropagation();

      const data = new FormData(form);
      const payload: Record<string, string> = {};
      data.forEach((value, key) => {
        if (typeof value === "string") payload[key] = value;
      });

      // Normalize common fields
      const name =
        payload["name-1"] ||
        payload.name ||
        payload["input-1"] ||
        [payload["name-1-first-name"], payload["name-1-last-name"]].filter(Boolean).join(" ") ||
        "";
      const email = payload["email-1"] || payload.email || payload["email"] || "";
      const phone =
        payload["phone-1"] || payload.phone || payload.tel || payload["text-1"] || "";
      const message =
        payload["textarea-1"] || payload.message || payload["text-2"] || payload.comment || "";

      const path = window.location.pathname;
      const kind = path.includes("career")
        ? "careers"
        : path.includes("renabond") ||
            path.includes("renaplast") ||
            path.includes("renafix") ||
            path.includes("renacon-") ||
            path.includes("cement") ||
            path.includes("rapid-wall")
          ? "brochure"
          : "contact";

      const endpoint =
        kind === "careers" ? "/api/careers/" : kind === "brochure" ? "/api/brochure/" : "/api/contact/";

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            name: name || "Website visitor",
            email: email || "unknown@renacon.in",
            phone: phone || "0000000000",
            message,
            kind,
            product: document.title,
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error || "Submit failed");
        alert("Thank you. Your request has been received.");
        form.reset();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Unable to submit form");
      }
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  return null;
}
