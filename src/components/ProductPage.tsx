import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import type { Product } from "@/data/products";

export function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <PageHero title={product.name} subtitle={product.summary} />
      <article className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="mb-8 max-h-80 w-full rounded-3xl object-contain bg-emerald-50 p-6"
          />
          <div className="space-y-4 text-base leading-7 text-slate-700">
            {product.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <h2 className="mt-10 text-2xl font-semibold text-slate-900">Key features</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li
                key={f}
                className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-700 shadow-sm"
              >
                {f}
              </li>
            ))}
          </ul>
          {product.methodology?.map((m) => (
            <section key={m.title} className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-900">{m.title}</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
                {m.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          ))}
          {product.extra?.map((m) => (
            <section key={m.title} className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-900">{m.title}</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
                {m.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          ))}
          {product.tdsHref ? (
            <p className="mt-8">
              <a
                className="font-semibold text-emerald-700 underline"
                href={product.tdsHref}
              >
                View technical data sheet (TDS)
              </a>
            </p>
          ) : null}
        </div>
        <aside className="h-fit rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold">Download brochure</h2>
          <p className="mb-6 text-sm text-slate-600">
            Share your details to receive the {product.brochureName}.
          </p>
          <LeadForm kind="brochure" product={product.name} />
        </aside>
      </article>
    </>
  );
}
