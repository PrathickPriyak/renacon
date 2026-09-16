import { PageHero } from "@/components/PageHero";
import { SITE } from "@/data/site";

export const metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About us"
        subtitle="Renaatus Procon Private Limited is the leading manufacturer of Autoclaved Aerated Concrete (AAC), with five decades of experience in the construction industry."
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-14 text-base leading-7 text-slate-700">
        <p>
          We design, manufacture and deliver the country’s most sustainable AAC blocks from
          manufacturing units across Tamil Nadu. From our inception we have focused on water and
          energy efficiency, productivity, monetary savings and minimum wastage. We use fossil energy
          wastes for making our products and also manufacture sustainable construction chemicals.
        </p>
        <section className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-[220px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SITE.founderImage}
            alt="P. Selvasundaram, Chairman & Managing Director"
            className="h-56 w-full rounded-2xl object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">About the Founder</h2>
            <p className="mt-1 font-medium text-emerald-700">
              P. Selvasundaram · Chairman &amp; Managing Director
            </p>
            <p className="mt-4">
              Mr. Selvasundaram is a pioneering leader whose commitment and professional integrity
              have helped the RPP Group reach unparalleled success. In the last 50 years the group
              has evolved in name, operations and technology, while remaining focused on serving
              society. Each strategic decision revolves around welfare, because without society there
              is no business or growth.
            </p>
            <blockquote className="mt-4 border-l-4 border-emerald-500 pl-4 italic">
              The future is for those who dare to dream and find the courage to pursue their dreams.
              — Renaatus
            </blockquote>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Vision 2030</h2>
          <p className="mt-3">
            India’s construction market is among the top five in the world and is expected to grow
            toward $1.4 trillion (INR 99 lakh crores), serving 51 million employees. Renacon’s
            Vision 2030 rests on employees first, customer friendliness and innovation.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Employees first:</strong> empower every employee in their job and with their
              families; aim for contribution toward well-being and work delivered with heart.
            </li>
            <li>
              <strong>Customer friendly:</strong> welcome customers professionally, manage work with
              better process than others in the industry, and lead by example.
            </li>
            <li>
              <strong>Innovation is key:</strong> create an environment that generates ideas and
              measures effectiveness, leaving a legacy of creative products.
            </li>
          </ul>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-emerald-50 p-6">
            <h3 className="text-xl font-semibold">Our vision</h3>
            <p className="mt-2">
              We strive to create a green and eco-friendly environment by supplying innovative
              products that stimulate growth in the construction industry.
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-6">
            <h3 className="text-xl font-semibold">Our mission</h3>
            <p className="mt-2">
              To make Renacon replace conventional clay bricks and concrete blocks by offering
              innovative, eco-friendly, new-age technology products and unmatched service backup.
            </p>
          </div>
        </section>
        <p className="font-medium text-emerald-800">
          We serve 5000+ projects · Work with 3 Cs · Innovation through unique experience centres.
        </p>
      </div>
    </>
  );
}
