import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form submissions" };

const SHEETS_URL =
  "https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/edit";

function withSecret(path: string, secret: string): string {
  if (!secret) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}secret=${encodeURIComponent(secret)}`;
}

function fmt(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

type ProductRow = Awaited<ReturnType<typeof prisma.productSubmission.findMany>>[number];
type CareerRow = Awaited<ReturnType<typeof prisma.careerSubmission.findMany>>[number];
type ContactRow = Awaited<ReturnType<typeof prisma.contactSubmission.findMany>>[number];

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const params = await searchParams;
  const configured = (process.env.ADMIN_SECRET || "").trim();
  const provided = (params.secret || "").trim();

  if (configured && provided !== configured) {
    return (
      <main className="renacon-admin-submissions">
        <h1>Form submissions</h1>
        <p className="renacon-admin-hint">
          Unauthorized. Open this page with <code>?secret=YOUR_ADMIN_SECRET</code> or set an empty
          ADMIN_SECRET for local access.
        </p>
      </main>
    );
  }

  let productCount = 0;
  let careerCount = 0;
  let contactCount = 0;
  let products: ProductRow[] = [];
  let careers: CareerRow[] = [];
  let contacts: ContactRow[] = [];
  let dbAvailable = true;

  try {
    [productCount, careerCount, contactCount, products, careers, contacts] = await Promise.all([
      prisma.productSubmission.count(),
      prisma.careerSubmission.count(),
      prisma.contactSubmission.count(),
      prisma.productSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
      prisma.careerSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
      prisma.contactSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
    ]);
  } catch (err) {
    dbAvailable = false;
    console.error("[admin/submissions] database unavailable", err);
  }

  const secret = configured || provided;
  const productExport = withSecret("/api/brochure/export/", secret);
  const careerExport = withSecret("/api/careers/export/", secret);
  const contactExport = withSecret("/api/contact/export/", secret);

  return (
    <main className="renacon-admin-submissions">
      <h1>Form submissions</h1>
      <p className="renacon-admin-hint">
        {dbAvailable ? (
          <>
            Database is the source of truth for local Excel exports. Live Google Sheet:{" "}
          </>
        ) : (
          <>
            On this deploy the SQLite database is not available (normal on Vercel). Production leads
            are stored in Google Sheets:{" "}
          </>
        )}
        <a href={SHEETS_URL} target="_blank" rel="noreferrer">
          open spreadsheet
        </a>
        .
        {dbAvailable ? (
          <>
            {" "}
            Download Excel exports below, or open Prisma Studio locally with{" "}
            <code>npm run db:studio</code>.
          </>
        ) : (
          <> Use the Product / Careers / Contact tabs in the sheet to review submissions.</>
        )}
      </p>

      <div className="renacon-admin-grid">
        <section className="renacon-admin-card">
          <h2>Product / brochure</h2>
          <p className="renacon-admin-count">{dbAvailable ? productCount : "—"}</p>
          {dbAvailable ? (
            <a className="renacon-admin-btn" href={productExport}>
              Download Excel
            </a>
          ) : (
            <a className="renacon-admin-btn" href={SHEETS_URL} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          )}
        </section>
        <section className="renacon-admin-card">
          <h2>Careers</h2>
          <p className="renacon-admin-count">{dbAvailable ? careerCount : "—"}</p>
          {dbAvailable ? (
            <a className="renacon-admin-btn" href={careerExport}>
              Download Excel
            </a>
          ) : (
            <a className="renacon-admin-btn" href={SHEETS_URL} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          )}
        </section>
        <section className="renacon-admin-card">
          <h2>Contact</h2>
          <p className="renacon-admin-count">{dbAvailable ? contactCount : "—"}</p>
          {dbAvailable ? (
            <a className="renacon-admin-btn" href={contactExport}>
              Download Excel
            </a>
          ) : (
            <a className="renacon-admin-btn" href={SHEETS_URL} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          )}
        </section>
      </div>

      {!dbAvailable ? (
        <p className="renacon-admin-hint">
          Recent rows are not listed here because the local database is unavailable. Open the
          spreadsheet above for live Product, Careers, and Contact data.
        </p>
      ) : null}

      <section className="renacon-admin-table-block">
        <h2>Recent product / brochure (latest 50)</h2>
        {products.length === 0 ? (
          <p className="renacon-admin-hint">No product submissions yet.</p>
        ) : (
          <div className="renacon-admin-table-wrap">
            <table className="renacon-admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Product</th>
                </tr>
              </thead>
              <tbody>
                {products.map((row) => (
                  <tr key={row.id}>
                    <td>{fmt(row.submittedAt)}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td>{row.product || row.productPath}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="renacon-admin-table-block">
        <h2>Recent careers (latest 50)</h2>
        {careers.length === 0 ? (
          <p className="renacon-admin-hint">No career submissions yet.</p>
        ) : (
          <div className="renacon-admin-table-wrap">
            <table className="renacon-admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {careers.map((row) => (
                  <tr key={row.id}>
                    <td>{fmt(row.submittedAt)}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td>{row.role}</td>
                    <td>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="renacon-admin-table-block">
        <h2>Recent contact (latest 50)</h2>
        {contacts.length === 0 ? (
          <p className="renacon-admin-hint">No contact submissions yet.</p>
        ) : (
          <div className="renacon-admin-table-wrap">
            <table className="renacon-admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((row) => (
                  <tr key={row.id}>
                    <td>{fmt(row.submittedAt)}</td>
                    <td>{row.name}</td>
                    <td>{row.phone}</td>
                    <td>{row.city}</td>
                    <td>{row.products}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="renacon-admin-hint">
        Local SQLite file: <code>data/renacon.db</code>
        <br />
        Local Excel copies (when writable): <code>data/exports/*.xlsx</code>
        <br />
        <Link href="/">← Back to site</Link>
      </p>
    </main>
  );
}
