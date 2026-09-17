"use client";

import { useEffect } from "react";
import { isBrochurePath, resolveBrochureUrl, slugFromPath } from "@/lib/brochures";

type BrochureSubmitResponse = {
  ok?: boolean;
  error?: string;
  downloadUrl?: string;
};

function fieldValue(form: HTMLFormElement, selectors: string[]): string {
  for (const selector of selectors) {
    const el = form.querySelector(selector);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const value = el.value.trim();
      if (value) return value;
    }
  }
  return "";
}

function findPhoneInput(form: HTMLFormElement): HTMLInputElement | null {
  const byType = form.querySelector(
    '.wpforms-field-phone input, input[type="tel"], input[name*="phone" i]',
  );
  if (byType instanceof HTMLInputElement) return byType;

  const containers = form.querySelectorAll(".wpforms-field, .renacon-field");
  for (const container of containers) {
    const label = container.querySelector("label")?.textContent?.toLowerCase() || "";
    if (label.includes("phone") || label.includes("mobile")) {
      const input = container.querySelector("input");
      if (input instanceof HTMLInputElement) return input;
    }
  }

  const numberField = form.querySelector('.wpforms-field-number input, input[type="number"]');
  if (numberField instanceof HTMLInputElement) return numberField;
  return null;
}

function ensureStatus(form: HTMLFormElement): HTMLParagraphElement {
  let status = form.querySelector<HTMLParagraphElement>(".renacon-form-status, .renacon-otp-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "renacon-form-status renacon-otp-status";
    status.setAttribute("aria-live", "polite");
    const submitContainer =
      form.querySelector(
        ".wpforms-submit-container, .forminator-row-last, .forminator-button-submit, .renacon-careers-actions",
      ) || form;
    const anchor =
      submitContainer instanceof HTMLButtonElement
        ? submitContainer.parentElement || form
        : submitContainer;
    const parent = anchor.parentElement;
    if (parent) {
      parent.insertBefore(status, anchor);
    } else {
      form.appendChild(status);
    }
  }
  return status;
}

function setStatus(form: HTMLFormElement, message: string, kind: "info" | "error" | "ok" = "info") {
  const status = ensureStatus(form);
  status.textContent = message;
  status.dataset.kind = kind;
}

/** Style brochure forms for direct download (no OTP). */
function enhanceBrochureForm(form: HTMLFormElement): void {
  if (form.dataset.renaconBrochureEnhanced === "1") return;
  form.dataset.renaconBrochureEnhanced = "1";
  form.classList.add("renacon-brochure-form");

  // Remove any leftover OTP UI from older mirrors / cached HTML
  form.querySelectorAll(
    ".renacon-otp-controls, .renacon-send-otp, .renacon-verify-otp, .renacon-otp-input, .renacon-otp-label, .renacon-demo-otp-banner",
  ).forEach((el) => el.remove());

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"], .wpforms-submit');
  if (submitBtn) {
    submitBtn.textContent = "DOWNLOAD BROCHURE";
    submitBtn.classList.add("renacon-download-brochure");
  }
}

function extractBrochurePayload(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  data.forEach((value, key) => {
    if (typeof value === "string") payload[key] = value;
  });

  const name =
    fieldValue(form, ['.wpforms-field-name input', 'input[name*="name" i]']) ||
    payload["name-1"] ||
    payload.name ||
    payload["wpforms[fields][0]"] ||
    "";

  const phoneInput = findPhoneInput(form);
  const phone =
    phoneInput?.value.trim() ||
    payload["phone-1"] ||
    payload.phone ||
    payload.tel ||
    payload["wpforms[fields][4]"] ||
    payload["wpforms[fields][3]"] ||
    "";

  const email =
    fieldValue(form, ['.wpforms-field-email input', 'input[type="email"]']) ||
    payload["email-1"] ||
    payload.email ||
    payload["wpforms[fields][5]"] ||
    payload["wpforms[fields][1]"] ||
    "";

  const message =
    fieldValue(form, ['.wpforms-field-textarea textarea', "textarea"]) ||
    payload["textarea-1"] ||
    payload.message ||
    payload["wpforms[fields][2]"] ||
    "";

  return {
    ...payload,
    name: name || "Website visitor",
    email,
    phone,
    message,
    kind: "brochure",
    product: document.title,
    productPath: window.location.pathname,
    page_url: window.location.pathname,
  };
}

function isBrochureForm(form: HTMLFormElement): boolean {
  if (form.dataset.renaconBrochureEnhanced === "1") return true;
  if (form.classList.contains("renacon-brochure-form")) return true;
  const title = form.querySelector(".wpforms-title")?.textContent?.toLowerCase() || "";
  const submitText =
    form.querySelector(".wpforms-submit, button[type='submit']")?.textContent?.toLowerCase() || "";
  if (title.includes("brochure") || submitText.includes("download brochure")) return true;
  return isBrochurePath(window.location.pathname);
}

/**
 * Makes mirrored Forminator / brochure / careers forms post to our local APIs
 * so the WordPress UI keeps working without WP admin.
 * Brochure downloads: fill form → submit → download (no OTP).
 */
export function FormBridge() {
  useEffect(() => {
    const enhanceAll = () => {
      document.querySelectorAll("form").forEach((form) => {
        if (!(form instanceof HTMLFormElement)) return;
        if (isBrochureForm(form)) {
          enhanceBrochureForm(form);
        }
        if (
          form.className.includes("forminator") ||
          form.className.includes("wpforms") ||
          form.classList.contains("renacon-careers-form") ||
          /\/contact-us\/?$/.test(window.location.pathname) ||
          /\/careers\/?$/.test(window.location.pathname)
        ) {
          form.classList.add("renacon-contact-form");
          form.querySelectorAll<HTMLElement>(
            "input, textarea, select, .forminator-input, .forminator-textarea",
          ).forEach((el) => {
            if (el.dataset.renaconFocusReady === "1") return;
            el.dataset.renaconFocusReady = "1";
            el.addEventListener("focus", () => el.classList.add("renacon-field-focus"));
            el.addEventListener("blur", () => {
              el.classList.remove("renacon-field-focus");
              if (el.classList.contains("renacon-field-invalid") && "value" in el) {
                const value = String((el as HTMLInputElement).value || "").trim();
                if (value) el.classList.remove("renacon-field-invalid");
              }
            });
          });
        }
      });
    };

    enhanceAll();
    const observer = new MutationObserver(() => enhanceAll());
    observer.observe(document.body, { childList: true, subtree: true });

    const onSubmit = async (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const action = (form.getAttribute("action") || "").toLowerCase();
      const isWpForm =
        form.className.includes("forminator") ||
        form.className.includes("wpforms") ||
        form.classList.contains("renacon-careers-form") ||
        form.classList.contains("renacon-brochure-form") ||
        action.includes("admin-ajax") ||
        form.closest(".forminator-ui, .wpforms-container, .stk-block, .renacon-careers-form-wrap");
      if (!isWpForm) return;

      event.preventDefault();
      event.stopPropagation();

      const path = window.location.pathname;
      const brochure = isBrochureForm(form) || isBrochurePath(path);

      if (brochure) {
        enhanceBrochureForm(form);
        const payload = extractBrochurePayload(form);
        if (!payload.phone || payload.phone.replace(/\D/g, "").length < 8) {
          setStatus(form, "Enter a valid phone number.", "error");
          findPhoneInput(form)?.focus();
          return;
        }
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
          setStatus(form, "Enter a valid email address.", "error");
          return;
        }

        const submitBtn = form.querySelector<HTMLButtonElement>(
          'button[type="submit"], .wpforms-submit, .renacon-download-brochure',
        );
        const prevLabel = submitBtn?.textContent || "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        try {
          setStatus(form, "Submitting…");
          const res = await fetch("/api/brochure/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = (await res.json()) as BrochureSubmitResponse;
          if (!res.ok || !json.ok) throw new Error(json.error || "Submit failed");

          const downloadUrl =
            json.downloadUrl ||
            resolveBrochureUrl(path) ||
            `/api/brochure/file/?product=${encodeURIComponent(slugFromPath(path))}`;

          setStatus(form, "Thank you. Your brochure download is starting…", "ok");
          const anchor = document.createElement("a");
          anchor.href = downloadUrl;
          anchor.target = "_blank";
          anchor.rel = "noopener";
          anchor.download = "";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          form.reset();
        } catch (err) {
          setStatus(form, err instanceof Error ? err.message : "Unable to submit form", "error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = prevLabel || "DOWNLOAD BROCHURE";
          }
        }
        return;
      }

      const data = new FormData(form);
      const payload: Record<string, string> = {};
      data.forEach((value, key) => {
        if (typeof value === "string") payload[key] = value;
      });

      const name =
        payload["name-1"] ||
        payload.name ||
        payload["input-1"] ||
        payload["wpforms[fields][3]"] ||
        [payload["name-1-first-name"], payload["name-1-last-name"]].filter(Boolean).join(" ") ||
        fieldValue(form, ['input[name="name"]', 'input[name*="name" i]', ".wpforms-field-name input"]) ||
        "";
      const email =
        payload["email-1"] ||
        payload.email ||
        payload["wpforms[fields][48]"] ||
        fieldValue(form, ['input[type="email"]', 'input[name="email"]']) ||
        "";
      const phone =
        payload["phone-1"] ||
        payload.phone ||
        payload.tel ||
        payload["text-1"] ||
        payload["wpforms[fields][13]"] ||
        findPhoneInput(form)?.value.trim() ||
        "";
      const message =
        payload["textarea-1"] ||
        payload.message ||
        payload["text-2"] ||
        payload.comment ||
        fieldValue(form, ["textarea"]) ||
        "";

      const kind = path.includes("career") || form.classList.contains("renacon-careers-form")
        ? "careers"
        : "contact";
      const endpoint = kind === "careers" ? "/api/careers/" : "/api/contact/";

      form.classList.add("renacon-contact-form");
      const clearFieldStates = () => {
        form.querySelectorAll(".renacon-field-invalid").forEach((el) =>
          el.classList.remove("renacon-field-invalid"),
        );
      };
      clearFieldStates();

      const markInvalid = (selector: string) => {
        const el = form.querySelector(selector);
        if (el instanceof HTMLElement) {
          el.classList.add("renacon-field-invalid");
          el.focus();
        }
      };

      if (!name.trim()) {
        setStatus(form, "Please enter your name.", "error");
        markInvalid('input[name="name"], input[name="name-1"], input[name*="name" i], .forminator-name--field');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus(form, "Enter a valid email address.", "error");
        markInvalid('input[type="email"], input[name="email"], input[name="email-1"], .forminator-email--field');
        return;
      }
      if (phone && phone.replace(/\D/g, "").length > 0 && phone.replace(/\D/g, "").length < 8) {
        setStatus(form, "Enter a valid phone number.", "error");
        markInvalid('input[name="phone"], input[name="phone-1"], .forminator-field--phone, input[type="tel"]');
        return;
      }
      const phoneForApi = phone.trim() || "0000000000";

      const submitBtn = form.querySelector<HTMLButtonElement>(
        'button[type="submit"], .forminator-button-submit, .wpforms-submit',
      );
      const prevLabel = submitBtn?.textContent || "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("renacon-submit-busy");
        submitBtn.textContent = "Sending…";
      }

      try {
        setStatus(
          form,
          kind === "careers" ? "Submitting your application…" : "Sending your message…",
          "info",
        );
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            name: name.trim(),
            email: email.trim(),
            phone: phoneForApi,
            message,
            kind,
            product: document.title,
            page_url: path,
            role: payload.role || "",
            experience: payload.experience || "",
            location: payload.location || "",
            qualification: payload.qualification || "",
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error || "Submit failed");
        setStatus(
          form,
          kind === "careers"
            ? "Application received. Our HR team will contact shortlisted candidates."
            : "Thank you. Your request has been received.",
          "ok",
        );
        form.classList.add("renacon-form-success");
        form.reset();
        clearFieldStates();
        const responseMsg = form.querySelector<HTMLElement>(".forminator-response-message");
        if (responseMsg) {
          responseMsg.classList.remove("forminator-error", "forminator-success");
          responseMsg.setAttribute("aria-hidden", "true");
          responseMsg.textContent = "";
        }
      } catch (err) {
        setStatus(
          form,
          err instanceof Error ? err.message : "Unable to submit form",
          "error",
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("renacon-submit-busy");
          submitBtn.textContent = prevLabel || (kind === "careers" ? "Submit application" : "Submit");
        }
      }
    };

    document.addEventListener("submit", onSubmit, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
