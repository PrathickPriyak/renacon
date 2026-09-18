/** Client helpers for the mirrored WPForms careers application (form 7919). */

const PAGE_TITLES = [
  "Personal Information",
  "Educational Qualification",
  "Work Experience",
  "Upload Resume",
] as const;

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_EXT = /\.(jpe?g|pdf)$/i;
const RESUME_EXT = /\.(pdf|doc|docx)$/i;

export type CareersMappedFields = {
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  role: string;
  experience: string;
  location: string;
  qualification: string;
  message: string;
  details: Record<string, string>;
};

function fieldString(el: Element | null): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      return el.checked ? el.value : "";
    }
    return el.value.trim();
  }
  return "";
}

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el.getClientRects().length > 0;
}

export function collectDetails(form: HTMLFormElement): Record<string, string> {
  const details: Record<string, string> = {};
  const data = new FormData(form);
  data.forEach((value, key) => {
    if (typeof value === "string" && key && !key.startsWith("wpforms[id]") && key !== "wpforms[submit]") {
      if (key.includes("[1]") && key.includes("fields][1]")) return; // honeypot
      details[key] = value;
    }
  });
  return details;
}

export function mapCareersFields(form: HTMLFormElement): CareersMappedFields {
  const details = collectDetails(form);
  const get = (id: string): string =>
    details[`wpforms[fields][${id}]`] ||
    fieldString(form.querySelector(`#wpforms-7919-field_${id}`));

  const ug = get("23");
  const pg = get("25");
  const qualification = [ug, pg, get("19"), get("21")].filter(Boolean).join(" / ");
  const prev = Object.entries(details)
    .filter(([key, value]) => key.includes("[44") && value)
    .map(([, value]) => value)
    .join("; ");

  return {
    name: get("3"),
    email: get("48"),
    phone: get("13"),
    altPhone: get("14"),
    role: get("50") || get("31"),
    experience: get("30"),
    location: get("32"),
    qualification,
    message: [get("29"), get("31"), get("32"), prev].filter(Boolean).join(" · "),
    details,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validatePhotoFile(file: File | null | undefined): string | null {
  if (!file || file.size <= 0) {
    return "Please upload your photo (JPG or PDF).";
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return "Photo must be 5MB or smaller.";
  }
  if (!PHOTO_EXT.test(file.name)) {
    return "Photo must be a JPG or PDF file.";
  }
  return null;
}

export function validateResumeFileClient(file: File | null | undefined): string | null {
  if (!file || file.size <= 0) {
    return "Please attach your resume (PDF, DOC, or DOCX).";
  }
  if (file.size > RESUME_MAX_BYTES) {
    return "Resume must be 5MB or smaller.";
  }
  if (!RESUME_EXT.test(file.name)) {
    return "Resume must be a PDF, DOC, or DOCX file.";
  }
  return null;
}

function clearFieldError(el: HTMLElement): void {
  el.classList.remove("wpforms-error", "renacon-field-invalid", "user-invalid");
  const container = el.closest(".wpforms-field");
  container?.querySelectorAll("em.wpforms-error[data-renacon-error]").forEach((node) => node.remove());
}

function showFieldError(el: HTMLElement, message: string): void {
  el.classList.add("wpforms-error", "renacon-field-invalid");
  const container = el.closest(".wpforms-field") || el.parentElement;
  if (!container) return;
  let em = container.querySelector<HTMLElement>("em.wpforms-error[data-renacon-error]");
  if (!em) {
    em = document.createElement("em");
    em.className = "wpforms-error";
    em.dataset.renaconError = "1";
    container.appendChild(em);
  }
  em.textContent = message;
}

function requiredMessage(): string {
  return "This field is required.";
}

function validateControl(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  clearFieldError(el);
  if (el.disabled) return true;
  const container = el.closest<HTMLElement>(".wpforms-field");
  if (container && !isVisible(container) && container.style.display === "none") return true;
  if (container?.id === "wpforms-7919-field_1-container") return true;

  if (el instanceof HTMLInputElement && el.type === "checkbox") {
    return true;
  }

  if (el.required || el.classList.contains("wpforms-field-required")) {
    if (!el.value.trim()) {
      showFieldError(el, requiredMessage());
      return false;
    }
  }

  if (el instanceof HTMLInputElement && el.type === "email" && el.value.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) {
      showFieldError(el, "Please enter a valid email address.");
      return false;
    }
  }

  if (el instanceof HTMLInputElement && el.type === "tel" && el.value.trim()) {
    if (el.value.replace(/\D/g, "").length < 8) {
      showFieldError(el, "Please enter a valid phone number.");
      return false;
    }
  }

  return true;
}

function validateCheckboxGroup(container: HTMLElement): boolean {
  const boxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  if (!boxes.length) return true;
  const anyRequired = boxes.some((box) => box.required) || container.classList.contains("wpforms-field-required");
  if (!anyRequired) return true;
  const checked = boxes.filter((box) => box.checked);
  boxes.forEach((box) => clearFieldError(box));
  if (!checked.length) {
    showFieldError(boxes[0]!, requiredMessage());
    return false;
  }
  return true;
}

function validateFileField(container: HTMLElement): boolean {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) return true;
  const kind = container.querySelector("[data-kind]")?.getAttribute("data-kind") || input.name;
  const file = input.files?.[0] || null;
  const error =
    kind === "photo" || input.name === "photo" ? validatePhotoFile(file) : validateResumeFileClient(file);
  const errorEl = container.querySelector<HTMLElement>(".renacon-resume-error, .wpforms-error");
  const zone = container.querySelector<HTMLElement>("[data-renacon-dropzone], .wpforms-uploader");
  if (error) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = error;
    }
    zone?.classList.add("is-invalid");
    input.classList.add("wpforms-error");
    return false;
  }
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
  zone?.classList.remove("is-invalid");
  input.classList.remove("wpforms-error");
  return true;
}

export function validateCareersPage(form: HTMLFormElement, page: HTMLElement): boolean {
  let ok = true;
  let firstInvalid: HTMLElement | undefined;

  page.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input:not([type='hidden']):not([type='file']):not([type='checkbox']):not([type='button']):not([type='submit']), select, textarea",
  ).forEach((el) => {
    const field = el.closest<HTMLElement>(".wpforms-field");
    if (field && (field.style.display === "none" || field.classList.contains("wpforms-conditional-hide"))) {
      return;
    }
    if (!validateControl(el)) {
      ok = false;
      firstInvalid ??= el;
    }
  });

  page.querySelectorAll<HTMLElement>(".wpforms-field-checkbox").forEach((group) => {
    if (group.style.display === "none") return;
    if (!validateCheckboxGroup(group)) {
      ok = false;
      firstInvalid ??= group.querySelector("input") ?? undefined;
    }
  });

  page.querySelectorAll<HTMLElement>(".wpforms-field-file-upload").forEach((group) => {
    if (group.style.display === "none") return;
    if (!validateFileField(group)) {
      ok = false;
      firstInvalid ??= group.querySelector("input") ?? undefined;
    }
  });

  firstInvalid?.focus();
  return ok;
}

function setProgress(form: HTMLFormElement, pageNum: number, total: number): void {
  const indicator = form.querySelector<HTMLElement>(".wpforms-page-indicator");
  const titleEl = form.querySelector<HTMLElement>(".wpforms-page-indicator-page-title");
  const stepEl = form.querySelector<HTMLElement>(".wpforms-page-indicator-steps-current");
  const bar = form.querySelector<HTMLElement>(".wpforms-page-indicator-page-progress");
  const title = PAGE_TITLES[pageNum - 1] || `Step ${pageNum}`;
  if (titleEl) titleEl.textContent = title;
  if (stepEl) stepEl.textContent = String(pageNum);
  if (indicator) {
    indicator.setAttribute("aria-valuenow", String(pageNum));
    indicator.setAttribute("aria-valuemax", String(total));
  }
  if (bar) {
    bar.style.width = `${Math.round((pageNum / total) * 100)}%`;
  }
}

function showPage(form: HTMLFormElement, pageNum: number): void {
  const pages = [...form.querySelectorAll<HTMLElement>(".wpforms-page")];
  pages.forEach((page) => {
    const n = Number(page.dataset.page || "0");
    const active = n === pageNum;
    page.style.display = active ? "" : "none";
    page.classList.toggle("active", active);
  });
  const submit = form.querySelector<HTMLElement>(".wpforms-submit-container");
  if (submit) {
    submit.style.display = pageNum === pages.length ? "" : "none";
  }
  setProgress(form, pageNum, pages.length);
  form.dataset.careersPage = String(pageNum);
  form.querySelector(".wpforms-page-indicator")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function wireDropzone(zone: HTMLElement): void {
  if (zone.dataset.renaconDropReady === "1") return;
  zone.dataset.renaconDropReady = "1";
  const input = zone.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) return;
  const nameEl = zone.querySelector<HTMLElement>("[data-renacon-filename]");
  const errorEl =
    zone.parentElement?.querySelector<HTMLElement>(".renacon-resume-error") ||
    zone.querySelector<HTMLElement>(".renacon-resume-error");
  const kind = zone.getAttribute("data-kind") || input.name;

  const applyFile = (file: File | null) => {
    const error =
      kind === "photo" || input.name === "photo" ? validatePhotoFile(file) : validateResumeFileClient(file);
    if (nameEl) {
      if (file) {
        nameEl.hidden = false;
        nameEl.textContent = `${file.name} (${formatFileSize(file.size)})`;
      } else {
        nameEl.hidden = true;
        nameEl.textContent = "";
      }
    }
    zone.classList.toggle("has-file", Boolean(file));
    zone.classList.toggle("is-invalid", Boolean(error && file));
    if (errorEl) {
      if (error && file) {
        errorEl.hidden = false;
        errorEl.textContent = error;
      } else {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    }
  };

  input.addEventListener("change", () => applyFile(input.files?.[0] || null));
  ["dragenter", "dragover"].forEach((type) => {
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove("is-dragover");
    });
  });
  zone.addEventListener("drop", (event) => {
    const file = (event as DragEvent).dataTransfer?.files?.[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    applyFile(file);
  });
  zone.addEventListener("click", (event) => {
    if (event.target === input) return;
    input.click();
  });
}

function wireRepeater(form: HTMLFormElement): void {
  const root = form.querySelector<HTMLElement>(".wpforms-field-repeater");
  if (!root || root.dataset.renaconRepeater === "1") return;
  root.dataset.renaconRepeater = "1";
  const template = root.querySelector<HTMLScriptElement>("script.tmpl-wpforms-field-repeater-template-43-7919");
  const max = Number(root.getAttribute("data-rows-max") || "10");
  let nextClone = Number(root.getAttribute("data-clone-num") || "2");

  const syncButtons = () => {
    const wraps = root.querySelectorAll(".wpforms-field-repeater-display-rows-buttons");
    wraps.forEach((wrap, index) => {
      const remove = wrap.querySelector<HTMLButtonElement>(".wpforms-field-repeater-button-remove");
      if (!remove) return;
      const disable = wraps.length <= 1;
      remove.classList.toggle("wpforms-disabled", disable);
      remove.disabled = disable;
      remove.setAttribute("aria-disabled", disable ? "true" : "false");
      if (index === 0 && disable) {
        remove.classList.add("wpforms-disabled");
      }
    });
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const add = target.closest<HTMLButtonElement>(".wpforms-field-repeater-button-add");
    const remove = target.closest<HTMLButtonElement>(".wpforms-field-repeater-button-remove");
    if (add) {
      event.preventDefault();
      const rows = root.querySelectorAll(".wpforms-layout-row").length;
      if (rows >= max || !template) return;
      const html = template.innerHTML.replace(/\{CLONE\}/g, String(nextClone));
      nextClone += 1;
      const holder = document.createElement("div");
      holder.innerHTML = html.trim();
      const node = holder.firstElementChild;
      const host = root.querySelector(".wpforms-field-layout-rows");
      if (node && host) host.appendChild(node);
      syncButtons();
      return;
    }
    if (remove && !remove.classList.contains("wpforms-disabled")) {
      event.preventDefault();
      const row = remove.closest(".wpforms-layout-row") || remove.closest(".wpforms-field-repeater-clone-wrap");
      const host = root.querySelector(".wpforms-field-layout-rows");
      if (row && host && host.querySelectorAll(".wpforms-layout-row").length > 1) {
        row.remove();
      }
      syncButtons();
    }
  });
  syncButtons();
}

function wireSameAddress(form: HTMLFormElement): void {
  const yes = form.querySelector<HTMLInputElement>("#wpforms-7919-field_51_1");
  const no = form.querySelector<HTMLInputElement>("#wpforms-7919-field_51_4");
  const permanent = form.querySelector<HTMLElement>("#wpforms-7919-field_18-container");
  if (!yes || !no || !permanent) return;

  const apply = () => {
    const showPermanent = no.checked && !yes.checked;
    permanent.style.display = showPermanent ? "" : "none";
    permanent.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select").forEach((el) => {
      if (showPermanent) {
        el.setAttribute("required", "required");
      } else {
        el.removeAttribute("required");
      }
    });
  };

  yes.addEventListener("change", () => {
    if (yes.checked) no.checked = false;
    apply();
  });
  no.addEventListener("change", () => {
    if (no.checked) yes.checked = false;
    apply();
  });
  apply();
}

export function enhanceCareersWizard(form: HTMLFormElement): void {
  if (form.dataset.renaconWizard === "1") return;
  form.dataset.renaconWizard = "1";
  form.classList.add("renacon-careers-form");
  form.setAttribute("enctype", "multipart/form-data");
  form.setAttribute("novalidate", "novalidate");

  form.querySelectorAll<HTMLElement>("[data-renacon-dropzone], .wpforms-uploader").forEach(wireDropzone);
  wireRepeater(form);
  wireSameAddress(form);

  const honeypot = form.querySelector<HTMLElement>("#wpforms-7919-field_1-container");
  if (honeypot) {
    honeypot.style.cssText =
      "position:absolute!important;overflow:hidden!important;height:1px!important;width:1px!important;z-index:-1000!important;padding:0!important;";
  }

  const goNext = () => {
    const pages = [...form.querySelectorAll<HTMLElement>(".wpforms-page")];
    const current = Number(form.dataset.careersPage || "1");
    const page = pages.find((p) => Number(p.dataset.page) === current);
    if (page && !validateCareersPage(form, page)) return false;
    const next = Math.min(current + 1, pages.length);
    showPage(form, next);
    return true;
  };

  form.querySelectorAll(".wpforms-page-next").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      goNext();
    });
  });

  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLButtonElement) return;
    const pages = form.querySelectorAll(".wpforms-page");
    const current = Number(form.dataset.careersPage || "1");
    if (current < pages.length) {
      event.preventDefault();
      goNext();
    }
  });

  showPage(form, 1);
}

export function isCareersHoneypotTripped(form: HTMLFormElement): boolean {
  const trap = form.querySelector<HTMLInputElement>("#wpforms-7919-field_1");
  return Boolean(trap?.value.trim());
}
