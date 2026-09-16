import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import { FACTORIES, OFFICES } from "@/data/site";

export const metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <>
      <PageHero title="For your building solutions" subtitle="Enquiry, technical support and channel partner applications." />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div className="space-y-6">
          {OFFICES.map((o) => (
            <article key={o.title} className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-800">{o.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{o.address}</p>
              <p className="mt-2 text-sm">
                <a href={`tel:${o.phone.replace(/\s/g, "")}`}>{o.phone}</a>
                <br />
                <a href={`mailto:${o.email}`}>{o.email}</a>
              </p>
            </article>
          ))}
          <article className="rounded-3xl bg-emerald-900 p-6 text-emerald-50">
            <h2 className="text-lg font-semibold">Manufacturing units</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {FACTORIES.map((f) => (
                <li key={f.title}>
                  <strong>{f.title}</strong>
                  <br />
                  {f.address}
                </li>
              ))}
            </ul>
          </article>
        </div>
        <div className="space-y-10">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Enquiry form</h2>
            <LeadForm kind="contact" />
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Channel partner application</h2>
            <LeadForm kind="partner" />
          </div>
        </div>
      </div>
    </>
  );
}
