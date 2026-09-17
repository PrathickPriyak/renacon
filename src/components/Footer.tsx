import Link from "next/link";
import { FACTORIES, OFFICES, SITE } from "@/data/site";
import { products } from "@/data/products";

export function Footer() {
  return (
    <footer className="mt-20 bg-[#07261c] text-emerald-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.logo} alt="Renacon" className="mb-4 h-12 w-auto rounded bg-white p-1" />
          <p className="text-sm leading-6 text-emerald-100/80">
            {SITE.company} manufactures Autoclaved Aerated Concrete (AAC) blocks and sustainable
            construction chemicals across Tamil Nadu.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Pages</h3>
          <ul className="space-y-2 text-sm text-emerald-100/80">
            <li>
              <Link href="/about-us">About us</Link>
            </li>
            <li>
              <Link href="/why-renacon">Why Renacon</Link>
            </li>
            <li>
              <Link href="/our-products">Our products</Link>
            </li>
            <li>
              <Link href="/projects-2">Projects</Link>
            </li>
            <li>
              <Link href="/news">News &amp; blogs</Link>
            </li>
            <li>
              <Link href="/careers">Careers</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy policy</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Products</h3>
          <ul className="space-y-2 text-sm text-emerald-100/80">
            {products.slice(0, 8).map((p) => (
              <li key={p.slug}>
                <Link href={p.href}>{p.shortName}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Contact</h3>
          <p className="text-sm leading-6 text-emerald-100/80">{OFFICES[0].address}</p>
          <p className="mt-2 text-sm">
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
            <br />
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-emerald-300">Manufacturing</p>
          <ul className="mt-2 space-y-2 text-xs text-emerald-100/70">
            {FACTORIES.map((f) => (
              <li key={f.title}>{f.title}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-emerald-100/60">
        © {new Date().getFullYear()} {SITE.company}. All rights reserved.
      </div>
    </footer>
  );
}
