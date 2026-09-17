"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/data/site";
import { products } from "@/data/products";

const productLinks = products.map((p) => ({ href: p.href, label: p.shortName }));

export function Header() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b3d2c]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.logo} alt="Renacon" className="h-12 w-auto bg-white rounded-md p-1" />
          <span className="hidden text-sm font-semibold tracking-wide sm:block">
            AAC Blocks &amp; Green Building Materials
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link href="/" className="hover:text-emerald-300">
            Home
          </Link>
          <Link href="/about-us" className="hover:text-emerald-300">
            About us
          </Link>
          <Link href="/why-renacon" className="hover:text-emerald-300">
            Why Renacon
          </Link>
          <div className="relative group">
            <Link href="/our-products" className="hover:text-emerald-300">
              Products
            </Link>
            <div className="invisible absolute left-0 top-full z-50 mt-3 w-72 rounded-xl bg-white p-3 text-slate-800 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
              {productLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-emerald-50"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/projects-2" className="hover:text-emerald-300">
            Projects
          </Link>
          <Link href="/media" className="hover:text-emerald-300">
            Media
          </Link>
          <Link href="/news" className="hover:text-emerald-300">
            News
          </Link>
          <Link href="/careers" className="hover:text-emerald-300">
            Careers
          </Link>
          <Link href="/calculator" className="hover:text-emerald-300">
            Calculator
          </Link>
          <Link
            href="/contact-us"
            className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400"
          >
            Contact
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-lg border border-white/30 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {[
              ["/", "Home"],
              ["/about-us", "About us"],
              ["/why-renacon", "Why Renacon"],
              ["/our-products", "Our products"],
              ["/projects-2", "Projects"],
              ["/media", "Media"],
              ["/news", "News"],
              ["/careers", "Careers"],
              ["/calculator", "Calculator"],
              ["/contact-us", "Contact"],
            ].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <button
              type="button"
              className="text-left text-emerald-300"
              onClick={() => setProductsOpen((v) => !v)}
            >
              All products
            </button>
            {productsOpen
              ? productLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="pl-4 text-white/80"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
