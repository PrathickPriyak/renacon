# Renacon website (clean replica)

Official marketing site for **Renaatus Procon Private Limited (Renacon)** — South India’s AAC blocks and green building materials brand.

This repository is a clean rebuild of [renacon.in](https://renacon.in/). Third-party injected casino / gambling SEO spam that was hidden on the compromised WordPress homepage is **not** included.

## What’s included

- Home, About, Why Renacon, all product pages, Rapid Wall, projects, media, news/blogs, careers, contact (enquiry + channel partner), calculator, privacy, sitemap, TDS pages
- 139 official WordPress posts (company news and blogs)
- Brochure request, contact and careers forms save to the **database**, your **Google Sheet**, and local Excel exports; JSONL under `data/submissions/` is kept as a backup
- Careers applications accept resume + photo upload (PDF/DOC/DOCX / JPG, max 5MB) stored under `data/submissions/resumes|photos/`
- View submissions: Google Sheet, `npm run db:studio`, `/admin/submissions/`, or Excel export APIs (see below)

## Form submissions (database + Google Sheet + Excel)

Submissions from **product brochure**, **careers**, and **contact** forms are saved to:

1. **Database** (Prisma / SQLite locally at `data/renacon.db`)
2. **Your Google Sheet** (when credentials are configured):  
   https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/edit  
   Tabs: `Product`, `Careers`, `Contact`
3. **Local Excel** under `data/exports/` when the filesystem is writable

### Connect the Google Sheet (one-time)

**Option A — Service account (best for Vercel)**  
1. In [Google Cloud Console](https://console.cloud.google.com/) create a project → enable **Google Sheets API**.  
2. Create a **Service account** → download JSON key.  
3. Open the spreadsheet → Share → add the service account email as **Editor**.  
4. Set in `.env` / Vercel:
   - `GOOGLE_SHEETS_SPREADSHEET_ID=1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA`
   - `GOOGLE_SERVICE_ACCOUNT_JSON=` (full JSON as one line)  
     *or* `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`

**Option B — Apps Script webhook (fastest)**  
1. Open the sheet → **Extensions → Apps Script**.  
2. Paste contents of `scripts/google-sheets-apps-script.js`.  
3. **Deploy → New deployment → Web app** (Execute as: Me, Who has access: Anyone).  
4. Set `GOOGLE_SHEETS_WEBHOOK_URL` to the web app URL in `.env` / Vercel.

Until one of these is set, forms still save to the database and local Excel; they will not appear in Google Sheets.

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

3. **Google Sheet** (after connecting credentials above)  
   https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/edit

4. **Excel downloads**  
   - http://localhost:3000/api/brochure/export/  
   - http://localhost:3000/api/careers/export/  
   - http://localhost:3000/api/contact/export/  
   Or use the buttons on `/admin/submissions/`.

5. **SQLite file directly**  
   Open `data/renacon.db` with [DB Browser for SQLite](https://sqlitebrowser.org/) or the VS Code “SQLite” extension.

6. **Production (Vercel)**  
   Local SQLite is **not** durable on Vercel. Set a Postgres `DATABASE_URL` and change `provider` in `prisma/schema.prisma` to `postgresql`, then run migrations. View data in your Postgres host dashboard (Neon/Supabase/Vercel Postgres), the Google Sheet, or via Excel export APIs.

### Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:../data/renacon.db"
ADMIN_SECRET=""
GOOGLE_SHEETS_SPREADSHEET_ID="1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA"
# plus GOOGLE_SERVICE_ACCOUNT_JSON  OR  GOOGLE_SHEETS_WEBHOOK_URL
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
