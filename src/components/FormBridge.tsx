"use client";

import { useEffect } from "react";
import { isBrochurePath, resolveBrochureUrl, slugFromPath } from "@/lib/brochures";

type OtpSendResponse = {
  ok?: boolean;
  error?: string;
  demoMode?: boolean;
  devOtp?: string;
  demoChallenge?: string;
  message?: string;
};

type OtpVerifyResponse = {
  ok?: boolean;
  error?: string;
  verificationToken?: string;
};

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

  const containers = form.querySelectorAll(".wpforms-field");
  for (const container of containers) {
    const label = container.querySelector("label")?.textContent?.toLowerCase() || "";
    if (label.includes("phone") || label.includes("mobile")) {
      const input = container.querySelector("input");
      if (input instanceof HTMLInputElement) return input;
    }
  }

  // Many brochure forms use a number field for mobile
  const numberField = form.querySelector('.wpforms-field-number input, input[type="number"]');
  if (numberField instanceof HTMLInputElement) return numberField;
  return null;
}

function findNameInput(form: HTMLFormElement): HTMLInputElement | null {
  const el = form.querySelector(
    '.wpforms-field-name input, input[name*="name" i], input[autocomplete="name"]',
  );
  return el instanceof HTMLInputElement ? el : null;
}

function ensureStatus(form: HTMLFormElement): HTMLParagraphElement {
  let status = form.querySelector<HTMLParagraphElement>(".renacon-otp-status, .renacon-form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "renacon-otp-status renacon-form-status";
    status.setAttribute("aria-live", "polite");
    const submitContainer =
      form.querySelector(
        ".wpforms-submit-container, .forminator-row-last, .forminator-button-submit",
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

function enhanceBrochureForm(form: HTMLFormElement): void {
  if (form.dataset.renaconOtpEnhanced === "1") return;
  form.dataset.renaconOtpEnhanced = "1";
  form.classList.add("renacon-brochure-otp-form");

  const phoneInput = findPhoneInput(form);
  if (!phoneInput) return;

  const phoneContainer =
    phoneInput.closest(".wpforms-field") || phoneInput.parentElement || form;

  const otpWrap = document.createElement("div");
  otpWrap.className = "renacon-otp-controls wpforms-field";

  const sendBtn = document.createElement("button");
  sendBtn.type = "button";
  sendBtn.className = "renacon-send-otp";
  sendBtn.textContent = "Send OTP";

  const otpLabel = document.createElement("label");
  otpLabel.className = "wpforms-field-label renacon-otp-label";
  otpLabel.innerHTML = 'Enter OTP <span class="wpforms-required-label" aria-hidden="true">*</span>';
  otpLabel.hidden = true;

  const otpInput = document.createElement("input");
  otpInput.type = "text";
  otpInput.inputMode = "numeric";
  otpInput.maxLength = 6;
  otpInput.autocomplete = "one-time-code";
  otpInput.className = "renacon-otp-input wpforms-field-medium";
  otpInput.placeholder = "6-digit OTP";
  otpInput.hidden = true;

  const verifyBtn = document.createElement("button");
  verifyBtn.type = "button";
  verifyBtn.className = "renacon-verify-otp";
  verifyBtn.textContent = "Verify OTP";
  verifyBtn.hidden = true;

  const tokenInput = document.createElement("input");
  tokenInput.type = "hidden";
  tokenInput.name = "renacon_verification_token";
  tokenInput.className = "renacon-verification-token";

  const challengeInput = document.createElement("input");
  challengeInput.type = "hidden";
  challengeInput.name = "renacon_demo_challenge";
  challengeInput.className = "renacon-demo-challenge";

  const demoBanner = document.createElement("div");
  demoBanner.className = "renacon-demo-otp-banner";
  demoBanner.hidden = true;
  demoBanner.setAttribute("role", "status");

  otpWrap.append(sendBtn, demoBanner, otpLabel, otpInput, verifyBtn, tokenInput, challengeInput);
  phoneContainer.insertAdjacentElement("afterend", otpWrap);

  // Style submit button text
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"], .wpforms-submit');
  if (submitBtn) {
    submitBtn.textContent = "DOWNLOAD BROCHURE";
    submitBtn.classList.add("renacon-download-brochure");
  }

  let verified = false;

  sendBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    const name = findNameInput(form)?.value.trim() || "";
    if (phone.replace(/\D/g, "").length < 8) {
      setStatus(form, "Enter a valid phone number before sending OTP.", "error");
      phoneInput.focus();
      return;
    }
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    setStatus(form, "Sending OTP…");
    try {
      const res = await fetch("/api/otp/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });
      const json = (await res.json()) as OtpSendResponse;
      if (!res.ok || !json.ok) throw new Error(json.error || "Unable to send OTP");

      otpLabel.hidden = false;
      otpInput.hidden = false;
      verifyBtn.hidden = false;
      verified = false;
      tokenInput.value = "";
      form.dataset.otpVerified = "0";
      challengeInput.value = json.demoChallenge || "";

      if (json.demoMode && json.devOtp) {
        otpInput.value = json.devOtp;
        demoBanner.hidden = false;
        demoBanner.innerHTML = `<strong>Demo OTP:</strong> <code class="renacon-demo-otp-code">${json.devOtp}</code> — enter this code (SMS keys not configured).`;
        setStatus(
          form,
          json.message || `Demo mode: your OTP is ${json.devOtp}. Click Verify OTP to continue.`,
          "ok",
        );
      } else {
        demoBanner.hidden = true;
        demoBanner.textContent = "";
        otpInput.value = "";
        setStatus(
          form,
          "OTP sent to your mobile number. Enter the SMS code and click Verify OTP.",
          "ok",
        );
      }
      otpInput.focus();
    } catch (err) {
      setStatus(form, err instanceof Error ? err.message : "Unable to send OTP", "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send OTP";
    }
  });

  verifyBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    const otp = otpInput.value.trim();
    if (!/^\d{6}$/.test(otp)) {
      setStatus(form, "Enter the 6-digit OTP.", "error");
      otpInput.focus();
      return;
    }
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying…";
    try {
      const res = await fetch("/api/otp/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          demoChallenge: challengeInput.value || undefined,
        }),
      });
      const json = (await res.json()) as OtpVerifyResponse;
      if (!res.ok || !json.ok || !json.verificationToken) {
        throw new Error(json.error || "OTP verification failed");
      }
      tokenInput.value = json.verificationToken;
      verified = true;
      form.dataset.otpVerified = "1";
      setStatus(form, "Phone verified. You can download the brochure now.", "ok");
      otpInput.disabled = true;
      verifyBtn.textContent = "Verified";
    } catch (err) {
      verified = false;
      form.dataset.otpVerified = "0";
      tokenInput.value = "";
      setStatus(form, err instanceof Error ? err.message : "OTP verification failed", "error");
      verifyBtn.textContent = "Verify OTP";
    } finally {
      verifyBtn.disabled = verified;
    }
  });

  phoneInput.addEventListener("input", () => {
    if (!verified) return;
    verified = false;
    form.dataset.otpVerified = "0";
    tokenInput.value = "";
    challengeInput.value = "";
    demoBanner.hidden = true;
    demoBanner.textContent = "";
    otpInput.disabled = false;
    otpInput.value = "";
    verifyBtn.hidden = false;
    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify OTP";
    setStatus(form, "Phone changed — please send and verify OTP again.", "info");
  });
}

function extractPayload(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  data.forEach((value, key) => {
    if (typeof value === "string") payload[key] = value;
  });

  const name =
    fieldValue(form, [
      '.wpforms-field-name input',
      'input[name*="name" i]',
    ]) ||
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

  const verificationToken =
    (form.querySelector(".renacon-verification-token") as HTMLInputElement | null)?.value ||
    payload.renacon_verification_token ||
    "";

  return {
    ...payload,
    name: name || "Website visitor",
    email,
    phone,
    message,
    verificationToken,
    kind: "brochure",
    product: document.title,
    productPath: window.location.pathname,
    page_url: window.location.pathname,
  };
}

function isBrochureForm(form: HTMLFormElement): boolean {
  if (form.dataset.renaconOtpEnhanced === "1") return true;
  const title = form.querySelector(".wpforms-title")?.textContent?.toLowerCase() || "";
  const submitText =
    form.querySelector(".wpforms-submit, button[type='submit']")?.textContent?.toLowerCase() || "";
  if (title.includes("brochure") || submitText.includes("download brochure")) return true;
  return isBrochurePath(window.location.pathname);
}

/**
 * Makes mirrored Forminator / brochure forms post to our local APIs
 * so the WordPress UI keeps working without WP admin.
 * Brochure pages require OTP verification before download.
 */
export function FormBridge() {
  useEffect(() => {
    const enhanceAll = () => {
      if (!isBrochurePath(window.location.pathname)) {
        // Still enhance forms that explicitly say Download Brochure on other paths
      }
      document.querySelectorAll("form").forEach((form) => {
        if (!(form instanceof HTMLFormElement)) return;
        if (isBrochureForm(form)) {
          enhanceBrochureForm(form);
        }
        // Contact / Forminator interactive focus polish
        if (
          form.className.includes("forminator") ||
          form.className.includes("wpforms") ||
          /\/contact-us\/?$/.test(window.location.pathname)
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
        action.includes("admin-ajax") ||
        form.closest(".forminator-ui, .wpforms-container, .stk-block");
      if (!isWpForm) return;

      event.preventDefault();
      event.stopPropagation();

      const path = window.location.pathname;
      const brochure = isBrochureForm(form) || isBrochurePath(path);

      if (brochure) {
        enhanceBrochureForm(form);
        const payload = extractPayload(form);
        if (!payload.verificationToken || form.dataset.otpVerified !== "1") {
          setStatus(form, "Please verify OTP before downloading the brochure.", "error");
          return;
        }
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
          setStatus(form, "Enter a valid email address.", "error");
          return;
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

          setStatus(form, "Verified. Your brochure download is starting…", "ok");
          const anchor = document.createElement("a");
          anchor.href = downloadUrl;
          anchor.target = "_blank";
          anchor.rel = "noopener";
          anchor.download = "";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();

          form.reset();
          form.dataset.otpVerified = "0";
          const token = form.querySelector<HTMLInputElement>(".renacon-verification-token");
          if (token) token.value = "";
          const otpInput = form.querySelector<HTMLInputElement>(".renacon-otp-input");
          if (otpInput) {
            otpInput.disabled = false;
            otpInput.value = "";
          }
          const verifyBtn = form.querySelector<HTMLButtonElement>(".renacon-verify-otp");
          if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify OTP";
            verifyBtn.hidden = true;
          }
          const otpLabel = form.querySelector<HTMLLabelElement>(".renacon-otp-label");
          if (otpLabel) otpLabel.hidden = true;
          if (otpInput) otpInput.hidden = true;
        } catch (err) {
          setStatus(form, err instanceof Error ? err.message : "Unable to submit form", "error");
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
        [payload["name-1-first-name"], payload["name-1-last-name"]].filter(Boolean).join(" ") ||
        "";
      const email = payload["email-1"] || payload.email || payload["email"] || "";
      const phone =
        payload["phone-1"] || payload.phone || payload.tel || payload["text-1"] || "";
      const message =
        payload["textarea-1"] || payload.message || payload["text-2"] || payload.comment || "";

      const kind = path.includes("career") ? "careers" : "contact";
      const endpoint = kind === "careers" ? "/api/careers/" : "/api/contact/";

      // Inline validation feedback (contact / careers / dealer forms)
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
        markInvalid('input[name="name-1"], input[name*="name" i], .forminator-name--field');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus(form, "Enter a valid email address.", "error");
        markInvalid('input[type="email"], input[name="email-1"], .forminator-email--field');
        return;
      }
      if (phone && phone.replace(/\D/g, "").length > 0 && phone.replace(/\D/g, "").length < 8) {
        setStatus(form, "Enter a valid phone number.", "error");
        markInvalid('input[name="phone-1"], .forminator-field--phone, input[type="tel"]');
        return;
      }
      // Contact API requires phone — use placeholder only when field is optional & empty
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
        setStatus(form, "Sending your message…", "info");
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
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error || "Submit failed");
        setStatus(form, "Thank you. Your request has been received.", "ok");
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
          submitBtn.textContent = prevLabel || "Submit";
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
