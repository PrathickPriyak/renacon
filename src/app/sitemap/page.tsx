import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { products } from "@/data/products";
import { getPosts } from "@/lib/posts";

export const metadata = { title: "Sitemap" };

export default function SitemapPage() {
  const posts = getPosts();
  return (
    <>
      <PageHero title="Sitemap" subtitle="Every real page, product, brochure form and blog on this clean replica." />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-14">
        <section>
          <h2 className="text-xl font-semibold">Pages</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["/", "Home"],
              ["/about-us", "About us"],
              ["/why-renacon", "Why Renacon"],
              ["/our-products", "Our products"],
              ["/projects-2", "Projects"],
              ["/media", "Media"],
              ["/gallery", "Gallery"],
              ["/news", "News"],
              ["/careers", "Careers"],
              ["/contact-us", "Contact"],
              ["/calculator", "Calculator"],
              ["/privacy", "Privacy"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link className="text-emerald-800 hover:underline" href={href}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Products &amp; TDS</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {products.map((p) => (
              <li key={p.slug}>
                <Link className="text-emerald-800 hover:underline" href={p.href}>
                  {p.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/renafix-201-tds">Renafix 201 TDS</Link>
            </li>
            <li>
              <Link href="/renafix-211-tds">Renafix 211 TDS</Link>
            </li>
            <li>
              <Link href="/renafix-222-tds">Renafix 222 TDS</Link>
            </li>
            <li>
              <Link href="/renafix-tile-adhesive">Renafix tile adhesive</Link>
            </li>
            <li>
              <Link href="/renafix-grout">Renafix grout</Link>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Blogs ({posts.length})</h2>
          <ul className="mt-3 columns-1 gap-2 text-sm sm:columns-2">
            {posts.map((p) => (
              <li key={p.slug} className="mb-2 break-inside-avoid">
                <Link href={`/news/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
