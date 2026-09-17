import { notFound } from "next/navigation";
import { WpMain, WpShell } from "@/components/WpShell";
import { isProductSlug, readPageHtml, readPageStyles } from "@/lib/wpPages";

export function WpPage({ slug, title }: { slug: string; title?: string }) {
  const html = readPageHtml(slug);
  if (!html) notFound();

  const pageCss = readPageStyles(slug);
  const product = isProductSlug(slug);

  return (
    <WpShell>
      {title ? <title>{title}</title> : null}
      {/* Stackable block styles (background-image columns) omitted from mirrored HTML */}
      {pageCss ? (
        <style
          id={`renacon-page-styles-${slug}`}
          data-renacon-page-styles={slug}
          dangerouslySetInnerHTML={{ __html: pageCss }}
        />
      ) : null}
      {/* External page CSS with aggressive cache-bust (home + products) */}
      {pageCss || product ? (
        <link
          rel="stylesheet"
          href={`/wp-mirror/css/page-styles/${slug}.css?v=renacon-products-spacing-no-img-hover-202609171015`}
        />
      ) : null}
      {/* Hard cache-bust site overrides on calculator + product pages */}
      {slug === "calculator" || product ? (
        <link
          rel="stylesheet"
          href="/wp-mirror/css/site-overrides.css?v=renacon-products-spacing-no-img-hover-202609171015"
        />
      ) : null}
      <WpMain html={html} />
    </WpShell>
  );
}
