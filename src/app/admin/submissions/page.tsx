import Link from "next/link";
import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import {
  ADMIN_COOKIE,
  getConfiguredAdminSecret,
  isAdminAuthenticated,
} from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form submissions" };

function fmt(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export default async function AdminSubmissionsPage() {
  const jar = await cookies();
  const token = (jar.get(ADMIN_COOKIE)?.value || "").trim();
  const configured = getConfiguredAdminSecret();

  if (!isAdminAuthenticated(token)) {
    return (
      <main className="renacon-admin-submissions">
        <h1>Form submissions</h1>
        {configured ? (
          <>
            <p className="renacon-admin-hint">
              Sign in with the admin secret. The secret is stored in an HttpOnly cookie and is never
              placed in URLs.
            </p>
            <AdminLoginForm />
          </>
        ) : (
          <p className="renacon-admin-hint">
            Admin is not configured. Set <code>ADMIN_SECRET</code> in the environment (required in
            production).
          </p>
        )}
        <p className="renacon-admin-hint">
          <Link href="/">← Back to site</Link>
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

  return (
    <main className="renacon-admin-submissions">
      <h1>Form submissions</h1>
      <p className="renacon-admin-hint">
        Database is the source of truth. Download Excel exports below (authenticated via secure
        cookie), or open Prisma Studio locally with <code>npm run db:studio</code>.
      </p>

      <div className="renacon-admin-grid">
        <section className="renacon-admin-card">
          <h2>Product / brochure</h2>
          <p className="renacon-admin-count">{productCount}</p>
          <a className="renacon-admin-btn" href="/api/brochure/export/">
            Download Excel
          </a>
        </section>
        <section className="renacon-admin-card">
          <h2>Careers</h2>
          <p className="renacon-admin-count">{careerCount}</p>
          <a className="renacon-admin-btn" href="/api/careers/export/">
            Download Excel
          </a>
        </section>
        <section className="renacon-admin-card">
          <h2>Contact</h2>
          <p className="renacon-admin-count">{contactCount}</p>
          <a className="renacon-admin-btn" href="/api/contact/export/">
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
