import { notFound } from "next/navigation";
import { WpMain, WpShell } from "@/components/WpShell";
import { escapeHtml, getPost, getPosts, sanitizeHtml, safeUrl } from "@/lib/posts";

type Params = { slug: string };

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post?.title ?? "News" };
}

export default async function NewsArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const date = escapeHtml(post.date);
  const title = escapeHtml(post.title);
  const image = post.image ? safeUrl(post.image) : "";
  const body = sanitizeHtml(post.contentHtml);

  const html = `
<main id="main" class="site-main">
  <article class="post type-post">
    <div class="ct-container" style="padding:2rem 1rem 3rem;max-width:860px;margin:0 auto;">
      <p style="color:#0b3d2c;font-size:0.875rem;">${date}</p>
      <h1 style="font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.2;margin:0.5rem 0 1.5rem;">${title}</h1>
      ${image ? `<figure class="wp-block-image"><img src="${escapeHtml(image)}" alt="" style="width:100%;height:auto;border-radius:8px;"/></figure>` : ""}
      <div class="entry-content rich-content">${body}</div>
      <p style="margin-top:2rem;"><a href="/news/">← All news</a></p>
    </div>
  </article>
</main>`;

  return (
    <WpShell>
      <WpMain html={html} />
    </WpShell>
  );
}
