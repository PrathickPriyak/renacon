# Content inventory audit (2026-09-17)

## Pages (HTML mirror ↔ App Router)

| Source (`content/pages-html`) | Route | Status |
| --- | --- | --- |
| `home.html` | `/` | Present |
| `about-us.html` … product/TDS pages (32) | matching `/slug/` | Present |
| `_header.html` / `_footer.html` / `_offcanvas.html` | injected via `WpShell` | Present |

Audit result: **0 HTML pages without a route**, **0 orphan app routes**.

## News / blogs

- Inventory: `content/posts.json` — **139** posts
- Routes: `/news/`, `/news/page/[page]/`, `/news/[slug]/`
- Pagination: 12 per page → 12 pages total
- Empty `contentHtml`: **0**
- Missing featured image: **2** (still render with placeholder)

## Projects / media galleries

- Projects page: `/projects-2/` (canonical); `/projects/` redirects → `/projects-2/`
- Media: `/media/`
- Gallery hub: `/gallery/` embeds projects + media previews

## Forms / OTP

- Brochure download: form submit → `/api/brochure/` (no OTP in UI)
- Careers apply: multipart form → `/api/careers/` with required resume (PDF/DOC/DOCX, max 5MB); premium Renacon green/yellow panel (drag-drop upload + sticky mobile submit); files under `data/submissions/resumes/` (or `/tmp` on Vercel) + metadata in `careers.jsonl`
- OTP APIs retained unused: `/api/otp/send/`, `/api/otp/verify/`
- Without MSG91/Twilio/Fast2SMS env vars → **demoMode** with `devOtp` in response
- Documented in `env.sms.example`
