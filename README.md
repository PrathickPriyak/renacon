# Renacon website (clean replica)

Official marketing site for **Renaatus Procon Private Limited (Renacon)** — South India’s AAC blocks and green building materials brand.

This repository is a clean rebuild of [renacon.in](https://renacon.in/). Third-party injected casino / gambling SEO spam that was hidden on the compromised WordPress homepage is **not** included.

## What’s included

- Home, About, Why Renacon, all product pages, Rapid Wall, projects, media, news/blogs, careers, contact (enquiry + channel partner), calculator, privacy, sitemap, TDS pages
- 139 official WordPress posts (company news and blogs)
- Brochure request, contact and careers forms save to the **database** (Prisma / SQLite locally) and Excel exports under `data/exports/`; JSONL under `data/submissions/` is kept as a backup
- Careers applications accept resume + photo upload (PDF/DOC/DOCX / JPG, max 5MB) stored under `data/submissions/resumes|photos/`
- View submissions: `npm run db:studio`, `/admin/submissions/`, or Excel export APIs (see below)

## Form submissions (database + Excel)

Submissions from **product brochure**, **careers**, and **contact** forms are saved to a SQLite database locally (`data/renacon.db`) and synced to Excel under `data/exports/` when the filesystem is writable.

### How to view the database

1. **Prisma Studio (easiest GUI)**  
   ```bash
   npm run db:studio
   ```  
   Opens a browser UI at http://localhost:5555 — browse `ProductSubmission`, `CareerSubmission`, and `ContactSubmission` tables.

2. **Admin page in the app**  
   Open http://localhost:3000/admin/submissions/  
   Shows counts, recent rows (latest 50 per form), and Excel download buttons.  
   (On production, set `ADMIN_SECRET` and open `/admin/submissions/?secret=YOUR_SECRET`.)

3. **Excel downloads**  
   - http://localhost:3000/api/brochure/export/  
   - http://localhost:3000/api/careers/export/  
   - http://localhost:3000/api/contact/export/  
   Or use the buttons on `/admin/submissions/`.

4. **SQLite file directly**  
   Open `data/renacon.db` with [DB Browser for SQLite](https://sqlitebrowser.org/) or the VS Code “SQLite” extension.

5. **Production (Vercel)**  
   Local SQLite is **not** durable on Vercel. Set a Postgres `DATABASE_URL` and change `provider` in `prisma/schema.prisma` to `postgresql`, then run migrations. View data in your Postgres host dashboard (Neon/Supabase/Vercel Postgres) or via Excel export APIs.

### Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:../data/renacon.db"
ADMIN_SECRET=""
```

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

Brochure forms collect name, phone, and email, then start the download directly — **no OTP**.

## Notes

- **Home page** is an exact visual mirror of the pre-spam [renacon.in](https://renacon.in/) Blocksy/Editor Plus/Stackable homepage (`content/pages-html/home.html` + `content/page-styles/home.css`). Atmosphere-band redesigns are disabled; casino SEO spam from the compromised WP site is not included.
- Product photography and news images are loaded from the existing `renacon.in` media library.
- WordPress admin credentials must **not** be stored in this repo. Rotate the password that was shared in chat.
- After deploy, connect form submissions to email/CRM if you need inbox delivery.
- Content inventory audit: `docs/content-inventory-audit.md`
- Mobile offcanvas toggles and active nav colors are handled in `WpInteractions` (not WordPress JS).
