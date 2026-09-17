import { WpShell, WpMain } from "@/components/WpShell";
import { readPageHtml } from "@/lib/wpPages";

export const metadata = { title: "Gallery" };

export default function Page() {
  const projects = readPageHtml("projects-2") ?? "";
  const media = readPageHtml("media") ?? "";

  const html = `
<main id="main" class="site-main gallery-hub">
  <div class="hero-section" data-type="type-2">
    <header class="entry-header ct-container-narrow">
      <h1 class="page-title">Gallery</h1>
      <p class="gallery-hub-lead">Explore our projects and media coverage.</p>
    </header>
  </div>
  <div class="ct-container gallery-hub-links">
    <a class="gallery-hub-card" href="/projects-2/">
      <strong>Projects</strong>
      <span>Construction sites and completed buildings</span>
    </a>
    <a class="gallery-hub-card" href="/media/">
      <strong>Media</strong>
      <span>Events, expos, and press moments</span>
    </a>
  </div>
  <section class="gallery-hub-preview" aria-label="Projects preview">
    ${projects.replace(/^[\s\S]*?<main[^>]*>/i, "").replace(/<\/main>[\s\S]*$/i, "")}
  </section>
  <section class="gallery-hub-preview" aria-label="Media preview">
    ${media.replace(/^[\s\S]*?<main[^>]*>/i, "").replace(/<\/main>[\s\S]*$/i, "")}
  </section>
</main>`;

  return (
    <WpShell>
      <link
        rel="stylesheet"
        href="/wp-mirror/css/page-styles/gallery.css?v=renacon-remaining-pages-202609171500"
      />
      <WpMain html={html} />
    </WpShell>
  );
}
