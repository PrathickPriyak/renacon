import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import { OPEN_ROLES, SITE } from "@/data/site";

export const metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <>
      <PageHero
        title="Careers"
        subtitle="Join the Renacon team and build a career in the building materials industry."
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_420px]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SITE.careersHero}
            alt="Renacon team"
            className="mb-8 h-72 w-full rounded-3xl object-cover"
          />
          <h2 className="text-2xl font-semibold">We are hiring</h2>
          <p className="mt-3 text-slate-700">
            Open positions 2026 — MBA in Sales &amp; Marketing, 3 to 7 years’ experience, preferred
            industry: building materials. Immediate joiners preferred. Salary as per industry
            standards. Send your resume to{" "}
            <a className="font-semibold text-emerald-700" href={`mailto:${SITE.careersEmail}`}>
              {SITE.careersEmail}
            </a>
            .
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {OPEN_ROLES.map((r) => (
              <article key={r.title} className="rounded-2xl border border-emerald-100 bg-white p-5">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {r.location} · {r.experience}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div className="h-fit rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Application form</h2>
          <LeadForm kind="careers" />
        </div>
      </div>
    </>
  );
}
