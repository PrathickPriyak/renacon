import Link from "next/link";
import { products } from "@/data/products";
import { SERVICES, SITE, STATS } from "@/data/site";
import { getProjects } from "@/lib/gallery";
import { getPosts } from "@/lib/posts";

export default function HomePage() {
  const latest = getPosts().slice(0, 6);
  const featuredProjects = getProjects().slice(0, 8);

  return (
    <>
      <section className="relative min-h-[78vh] overflow-hidden bg-black text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          autoPlay
          muted
          loop
          playsInline
          src={SITE.heroVideo}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06261c]/90 via-[#06261c]/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            {SITE.tagline}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            South India’s leading AAC blocks &amp; green wall solutions
          </h1>
          <p className="mt-6 max-w-xl text-lg text-emerald-50/90">
            Renacon is South India’s leading brand of Autoclaved Aerated Concrete (AAC) Blocks —
            saving time, steel, cement and labour on 200+ million sq. mt of walls.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/our-products"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold hover:bg-emerald-400"
            >
              Explore products
            </Link>
            <Link
              href="/contact-us"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-6 text-center shadow-lg shadow-emerald-900/5"
          >
            <div className="text-2xl">{s.icon}</div>
            <p className="mt-2 font-semibold text-slate-800">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Our services</p>
        <h2 className="mt-2 text-3xl font-semibold">Construction support with quality assured</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article key={s.title} className="rounded-3xl border border-emerald-100 bg-white p-6">
              <h3 className="text-lg font-semibold text-emerald-800">{s.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                Products
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Build faster with Renacon</h2>
            </div>
            <Link href="/our-products" className="text-sm font-semibold text-emerald-700">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                className="group overflow-hidden rounded-3xl border border-emerald-100 bg-[#f6fbf8] transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-40 w-full object-contain bg-white p-4" />
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-emerald-700">{p.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Our projects</h2>
          <Link href="/projects-2" className="text-sm font-semibold text-emerald-700">
            All projects
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProjects.map((p) => (
            <figure key={p.image} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.title} className="h-48 w-full object-cover" />
              <figcaption className="p-3 text-sm font-medium capitalize">{p.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-[#0b3d2c] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-semibold">Latest from Renacon</h2>
            <Link href="/news" className="text-sm font-semibold text-emerald-300">
              All news
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((post) => (
              <Link
                key={post.slug}
                href={`/news/${post.slug}`}
                className="overflow-hidden rounded-3xl bg-white/5"
              >
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt="" className="h-44 w-full object-cover" />
                ) : null}
                <div className="p-5">
                  <p className="text-xs text-emerald-200">{post.date}</p>
                  <h3 className="mt-2 font-semibold leading-snug">{post.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
