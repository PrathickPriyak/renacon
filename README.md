# Renacon website (clean replica)

Official marketing site for **Renaatus Procon Private Limited (Renacon)** — South India’s AAC blocks and green building materials brand.

This repository is a clean rebuild of [renacon.in](https://renacon.in/). Third-party injected casino / gambling SEO spam that was hidden on the compromised WordPress homepage is **not** included.

## What’s included

- Home, About, Why Renacon, all product pages, Rapid Wall, projects, media, news/blogs, careers, contact (enquiry + channel partner), calculator, privacy, sitemap, TDS pages
- 139 official WordPress posts (company news and blogs)
- Brochure request, contact and careers forms (stored as JSONL under `data/submissions/`, gitignored)
- Careers applications accept resume upload (PDF/DOC/DOCX, max 5MB) stored under `data/submissions/resumes/`; apply form uses a Renacon green/yellow premium panel with drag-drop upload

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production URL

Stable deploy: [https://renacon.vercel.app](https://renacon.vercel.app)

```bash
export VERCEL_TOKEN=…   # session only — never commit
./scripts/deploy-stable.sh
```

## Brochure downloads

Brochure forms collect name, phone, and email, then start the download directly — **no OTP step**.

OTP API routes (`/api/otp/send`, `/api/otp/verify`) remain available but unused by the UI. Copy `env.sms.example` → `.env.local` only if you re-enable SMS verification later.

## Notes

- **Home page** is an exact visual mirror of the pre-spam [renacon.in](https://renacon.in/) Blocksy/Editor Plus/Stackable homepage (`content/pages-html/home.html` + `content/page-styles/home.css`). Atmosphere-band redesigns are disabled; casino SEO spam from the compromised WP site is not included.
- Product photography and news images are loaded from the existing `renacon.in` media library.
- WordPress admin credentials must **not** be stored in this repo. Rotate the password that was shared in chat.
- After deploy, connect form submissions to email/CRM if you need inbox delivery.
- Content inventory audit: `docs/content-inventory-audit.md`
- Mobile offcanvas toggles and active nav colors are handled in `WpInteractions` (not WordPress JS).
