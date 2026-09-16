import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productGroups } from "@/data/products";

export const metadata = { title: "Our products" };

export default function ProductsIndexPage() {
  return (
    <>
      <PageHero
        title="Our products"
        subtitle="AAC blocks, joint mortar, plaster, putty, tile adhesives, grouts and Rapid Wall panels — manufactured for South India’s construction market."
      />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-14">
        {productGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-2xl font-semibold">{group.title}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((p) => (
                <Link
                  key={p.slug}
                  href={p.href}
                  className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="mb-4 h-36 w-full object-contain" />
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.summary}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-emerald-700">
                    Read more
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
