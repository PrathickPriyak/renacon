"use client";

import { FormEvent, useState } from "react";
import { resolveBrochureUrl } from "@/lib/brochures";

type Kind = "contact" | "partner" | "brochure" | "careers";

export function LeadForm({
  kind,
  product,
}: {
  kind: Kind;
  product?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    const endpoint =
      kind === "careers" ? "/api/careers" : kind === "brochure" ? "/api/brochure" : "/api/contact";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          kind,
          product,
          productPath: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; downloadUrl?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Unable to submit");
      }
      setStatus("ok");
      if (kind === "brochure") {
        const downloadUrl =
          json.downloadUrl ||
          resolveBrochureUrl(typeof window !== "undefined" ? window.location.pathname : "");
        setMessage("Thank you. Your brochure download is starting…");
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.download = "";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        setMessage(
          kind === "careers"
            ? "Application received. Our HR team will contact shortlisted candidates."
            : "Thank you. Our team will get back to you shortly.",
        );
      }
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (kind === "brochure") {
    return (
      <form onSubmit={onSubmit} className="renacon-brochure-form renacon-lead-brochure">
        <div className="renacon-field">
          <label>
            Name <span className="req">*</span>
          </label>
          <input name="name" required />
        </div>
        <div className="renacon-field">
          <label>
            Phone Number <span className="req">*</span>
          </label>
          <input name="phone" type="tel" required />
        </div>
        <div className="renacon-field">
          <label>
            Email <span className="req">*</span>
          </label>
          <input type="email" name="email" required />
        </div>
        <div className="renacon-field">
          <label>Comment or Message</label>
          <input name="message" />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="renacon-download-brochure"
        >
          {status === "loading" ? "Sending…" : "DOWNLOAD BROCHURE"}
        </button>
        {message ? (
          <p className="renacon-form-status" data-kind={status === "error" ? "error" : "ok"}>
            {message}
          </p>
        ) : null}
      </form>
    );
  }

  const input =
    "w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none ring-emerald-500/30 focus:ring-4";

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={input} name="name" required placeholder="Name *" />
        <input className={input} name="phone" required placeholder="Phone *" />
      </div>
      <input className={input} type="email" name="email" required placeholder="Email *" />
      {kind === "partner" ? (
        <>
          <input className={input} name="firm" required placeholder="Name of the firm *" />
          <input className={input} name="proprietor" required placeholder="Proprietor / Managing Partner *" />
          <select className={input} name="constitution" required defaultValue="">
            <option value="" disabled>
              Constitution of the firm *
            </option>
            <option>Proprietorship</option>
            <option>Partnership</option>
            <option>PVT LTD</option>
          </select>
          <textarea className={input} name="address" required placeholder="Address *" rows={3} />
          <div className="grid gap-4 sm:grid-cols-3">
            <input className={input} name="pan" required placeholder="PAN *" />
            <input className={input} name="gst" required placeholder="GST No *" />
            <input className={input} name="turnover" placeholder="Approx turnover" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input className={input} name="town" required placeholder="Town *" />
            <input className={input} name="district" required placeholder="District *" />
            <input className={input} name="state" required placeholder="State *" />
          </div>
          <input className={input} name="presentBusiness" placeholder="Present business" />
        </>
      ) : null}
      {kind === "careers" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} name="role" required placeholder="Position applying for *" />
            <input className={input} name="experience" required placeholder="Experience (years) *" />
          </div>
          <input className={input} name="location" required placeholder="Preferred location *" />
          <input className={input} name="qualification" required placeholder="Qualification *" />
        </>
      ) : null}
      <textarea className={input} name="message" rows={4} placeholder="Message" />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {status === "loading"
          ? "Sending…"
          : kind === "careers"
            ? "Submit application"
            : "Submit"}
      </button>
      {message ? (
        <p className={status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
