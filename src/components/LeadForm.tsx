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
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [demoChallenge, setDemoChallenge] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  async function sendOtp() {
    if (phone.replace(/\D/g, "").length < 8) {
      setStatus("error");
      setMessage("Enter a valid phone number before sending OTP.");
      return;
    }
    setOtpBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/otp/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devOtp?: string;
        demoMode?: boolean;
        demoChallenge?: string;
        message?: string;
      };
      if (!res.ok || !json.ok) throw new Error(json.error || "Unable to send OTP");
      setOtpSent(true);
      setVerificationToken("");
      setDemoChallenge(json.demoChallenge || "");
      if (json.demoMode && json.devOtp) {
        setOtp(json.devOtp);
        setStatus("ok");
        setMessage(
          json.message ||
            `Demo mode: OTP is ${json.devOtp}. Click Verify OTP to continue.`,
        );
      } else {
        setOtp("");
        setStatus("ok");
        setMessage(json.message || "OTP sent to your mobile. Enter the SMS code and verify.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyOtp() {
    setOtpBusy(true);
    try {
      const res = await fetch("/api/otp/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          demoChallenge: demoChallenge || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        verificationToken?: string;
      };
      if (!res.ok || !json.ok || !json.verificationToken) {
        throw new Error(json.error || "OTP verification failed");
      }
      setVerificationToken(json.verificationToken);
      setStatus("ok");
      setMessage("Phone verified. You can download the brochure now.");
    } catch (err) {
      setVerificationToken("");
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    const endpoint =
      kind === "careers" ? "/api/careers" : kind === "brochure" ? "/api/brochure" : "/api/contact";

    if (kind === "brochure" && !verificationToken) {
      setStatus("error");
      setMessage("Please verify OTP before downloading the brochure.");
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          phone: kind === "brochure" ? phone : data.phone,
          kind,
          product,
          verificationToken,
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
        setMessage("Verified. Your brochure download is starting…");
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.download = "";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setVerificationToken("");
        setOtpSent(false);
        setOtp("");
      } else {
        setMessage(
          kind === "careers"
            ? "Application received. Our HR team will contact shortlisted candidates."
            : "Thank you. Our team will get back to you shortly.",
        );
      }
      form.reset();
      setPhone("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (kind === "brochure") {
    return (
      <form onSubmit={onSubmit} className="renacon-brochure-otp-form renacon-lead-brochure">
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
          <input
            name="phone"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setVerificationToken("");
            }}
          />
        </div>
        <button type="button" className="renacon-send-otp" disabled={otpBusy} onClick={sendOtp}>
          {otpBusy ? "Please wait…" : "Send OTP"}
        </button>
        {otpSent ? (
          <div className="renacon-otp-controls">
            {message.includes("Demo mode") || message.includes("OTP is") ? (
              <div className="renacon-demo-otp-banner" role="status">
                <strong>Demo OTP:</strong>{" "}
                <code className="renacon-demo-otp-code">{otp || "———"}</code> — use this
                code when SMS is not configured.
              </div>
            ) : null}
            <div className="renacon-field">
              <label>
                Enter OTP <span className="req">*</span>
              </label>
              <input
                className="renacon-otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                placeholder="6-digit OTP"
              />
            </div>
            <button
              type="button"
              className="renacon-verify-otp"
              disabled={otpBusy || Boolean(verificationToken)}
              onClick={verifyOtp}
            >
              {verificationToken ? "Verified" : "Verify OTP"}
            </button>
          </div>
        ) : null}
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
          <p className={`renacon-otp-status`} data-kind={status === "error" ? "error" : "ok"}>
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
