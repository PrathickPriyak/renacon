# Renacon website (clean replica)

Official marketing site for **Renaatus Procon Private Limited (Renacon)** — South India’s AAC blocks and green building materials brand.

This repository is a clean rebuild of [renacon.in](https://renacon.in/). Third-party injected casino / gambling SEO spam that was hidden on the compromised WordPress homepage is **not** included.

## What’s included

- Home, About, Why Renacon, all product pages, Rapid Wall, projects, media, news/blogs, careers, contact (enquiry + channel partner), calculator, privacy, sitemap, TDS pages
- 139 official WordPress posts (company news and blogs)
- Brochure request, contact and careers forms (stored as JSONL under `data/submissions/`, gitignored)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Product photography and news images are loaded from the existing `renacon.in` media library.
- WordPress admin credentials must **not** be stored in this repo. Rotate the password that was shared in chat.
- After deploy, connect form submissions to email/CRM if you need inbox delivery.
