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
      {/* Belt-and-suspenders: global product stylesheet for all product routes */}
      {product ? (
        <link
          rel="stylesheet"
          href={`/wp-mirror/css/page-styles/${slug}.css?v=renacon-product-images-sep2026`}
        />
      ) : null}
      <WpMain html={html} />
    </WpShell>
  );
}
