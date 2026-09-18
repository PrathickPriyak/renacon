import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form submissions" };

function withSecret(path: string, secret: string): string {
  if (!secret) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}secret=${encodeURIComponent(secret)}`;
}

function fmt(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

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

  const [productCount, careerCount, contactCount, products, careers, contacts] = await Promise.all([
    prisma.productSubmission.count(),
    prisma.careerSubmission.count(),
    prisma.contactSubmission.count(),
    prisma.productSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
    prisma.careerSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
    prisma.contactSubmission.findMany({ orderBy: { submittedAt: "desc" }, take: 50 }),
  ]);

  const secret = configured || provided;
  const productExport = withSecret("/api/brochure/export/", secret);
  const careerExport = withSecret("/api/careers/export/", secret);
  const contactExport = withSecret("/api/contact/export/", secret);

  return (
    <main className="renacon-admin-submissions">
      <h1>Form submissions</h1>
      <p className="renacon-admin-hint">
        Database is the source of truth. Live Google Sheet (when configured):{" "}
        <a
          href="https://docs.google.com/spreadsheets/d/1IXkszTmv_qUOpq8VZXYWjQn7--G3cC9kqlOVbZfwtWA/edit"
          target="_blank"
          rel="noreferrer"
        >
          open spreadsheet
        </a>
        . Download Excel exports below, or open Prisma Studio locally with{" "}
        <code>npm run db:studio</code>.
      </p>

      <div className="renacon-admin-grid">
        <section className="renacon-admin-card">
          <h2>Product / brochure</h2>
          <p className="renacon-admin-count">{productCount}</p>
          <a className="renacon-admin-btn" href={productExport}>
            Download Excel
          </a>
        </section>
        <section className="renacon-admin-card">
          <h2>Careers</h2>
          <p className="renacon-admin-count">{careerCount}</p>
          <a className="renacon-admin-btn" href={careerExport}>
            Download Excel
          </a>
        </section>
        <section className="renacon-admin-card">
          <h2>Contact</h2>
          <p className="renacon-admin-count">{contactCount}</p>
          <a className="renacon-admin-btn" href={contactExport}>
            Download Excel
          </a>
        </section>
      </div>

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
