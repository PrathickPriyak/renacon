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
          href={`/wp-mirror/css/page-styles/${slug}.css?v=renacon-careers-match-202609180600`}
        />
      ) : null}
      {slug === "careers" ? (
        <>
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/wpforms-base.min.css?v=careers-match-20260918" />
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/wpforms-pro-base.min.css?v=careers-match-20260918" />
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/layout.min.css?v=careers-match-20260918" />
          <link
            rel="stylesheet"
            href="/wp-mirror/css/wpforms/layout-screen-big.min.css?v=careers-match-20260918"
            media="(min-width: 600px)"
          />
          <link
            rel="stylesheet"
            href="/wp-mirror/css/wpforms/layout-screen-small.min.css?v=careers-match-20260918"
            media="(max-width: 599.98px)"
          />
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/repeater.min.css?v=careers-match-20260918" />
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/dropzone.min.css?v=careers-match-20260918" />
          <link rel="stylesheet" href="/wp-mirror/css/wpforms/blocksy-wpforms.min.css?v=careers-match-20260918" />
        </>
      ) : null}
      {/* Hard cache-bust site overrides on calculator + product pages */}
      {slug === "calculator" || product ? (
        <link
          rel="stylesheet"
          href="/wp-mirror/css/header-blocksy-in.css?v=renacon-final-visual-qa-202609171825"
        />
      ) : null}
      <WpMain html={html} />
    </WpShell>
  );
}
