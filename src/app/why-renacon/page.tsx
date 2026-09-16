import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Why Renacon" };

export default function WhyPage() {
  return (
    <>
      <PageHero
        title="Why choose Renacon"
        subtitle="Certified manufacturers of green building materials — AAC blocks that are a perfect substitute for traditional red bricks."
      />
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Light-weight",
            "Faster construction",
            "Cost-effective",
            "Superior finishing",
            "Fire-resistant",
            "Thermally insulated",
            "Sound-proof",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white p-5 font-semibold text-emerald-800 shadow-sm">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-10 space-y-4 text-base leading-7 text-slate-700">
          <p>
            Renacon AAC blocks are made from fly ash, cement, lime and other raw materials, then
            cured under high-pressure steam in an autoclave. They offer high thermal insulation,
            energy saving, good fire rating, low water absorption and high load-bearing capacity.
          </p>
          <p>
            The product is accredited by BIS and certified by GreenPro. We are a member of IGBC.
            Manufacturing facilities follow quality standards and have been awarded 5S Platinum.
            Plants at Arcot, Perundurai and Tirunelveli SIPCOT cover the entire south region. Daily
            capacity is at least 200,000 AAC blocks. The Perundurai factory is India’s largest AAC
            block manufacturing unit.
          </p>
        </div>
      </div>
    </>
  );
}
