"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { CHAT_SUGGESTIONS, type ChatLink } from "@/lib/chatbot/knowledge";
import "./ChatWidget.css";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  links?: ChatLink[];
};

type ChatApiResponse = {
  ok?: boolean;
  error?: string;
  reply?: string;
  links?: ChatLink[];
};

const WELCOME: ChatMessage = {
  role: "assistant",
  text: "Hello, I am the Renacon assistant. Ask about AAC blocks, Renafix, locations, or how to download a product brochure. I only use public website information and do not change any of your existing enquiries.",
  links: [
    { label: "Our products", href: "/our-products/" },
    { label: "Contact us", href: "/contact-us/" },
  ],
};

export function ChatWidget() {
  const titleId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(window.location.pathname.startsWith("/admin"));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    setError("");
    setBusy(true);
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const res = await fetch("/api/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          pagePath: window.location.pathname,
        }),
      });
      const json = (await res.json()) as ChatApiResponse;
      if (!res.ok || !json.ok || !json.reply) {
        throw new Error(json.error || "Unable to reply");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", text: json.reply || "", links: json.links },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reply");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not answer just then. You can still use Contact Us or WhatsApp.",
          links: [
            { label: "Contact us", href: "/contact-us/" },
            { label: "WhatsApp", href: "https://wa.link/r5dd4i" },
          ],
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void send(draft);
  }

  if (hidden) return null;

  return (
    <div className="renacon-chat">
      {open ? (
        <section
          className="renacon-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="renacon-chat-header">
            <div>
              <h2 id={titleId}>Renacon assistant</h2>
              <p>Public product help · no change to your saved enquiries</p>
            </div>
            <button type="button" className="renacon-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>
          <div className="renacon-chat-log" ref={logRef}>
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className="renacon-chat-bubble" data-role={item.role}>
                {item.text}
                {item.links && item.links.length > 0 ? (
                  <div className="renacon-chat-links">
                    {item.links.map((link) => (
                      <a
                        key={link.href + link.label}
                        href={link.href}
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="renacon-chat-suggestions">
            {CHAT_SUGGESTIONS.map((item) => (
              <button key={item} type="button" disabled={busy} onClick={() => void send(item)}>
                {item}
              </button>
            ))}
          </div>
          {error ? <p className="renacon-chat-error">{error}</p> : null}
          <form className="renacon-chat-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="renacon-chat-input">
              Message
            </label>
            <input
              id="renacon-chat-input"
              ref={inputRef}
              value={draft}
              maxLength={500}
              autoComplete="off"
              placeholder="Ask about products or locations"
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !draft.trim()}>
              {busy ? "…" : "Send"}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="renacon-chat-launcher"
        aria-label={open ? "Close Renacon chat" : "Open Renacon chat"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <span aria-hidden="true">×</span>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  );
}
