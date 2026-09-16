import { notFound } from "next/navigation";
import { WpMain, WpShell } from "@/components/WpShell";
import { getPost, getPosts, sanitizeHtml } from "@/lib/posts";

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

  const html = `
<main id="main" class="site-main">
  <article class="post type-post">
    <div class="ct-container" style="padding:2rem 1rem 3rem;max-width:860px;margin:0 auto;">
      <p style="color:#0b3d2c;font-size:0.875rem;">${post.date}</p>
      <h1 style="font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.2;margin:0.5rem 0 1.5rem;">${post.title}</h1>
      ${post.image ? `<figure class="wp-block-image"><img src="${post.image}" alt="" style="width:100%;height:auto;border-radius:8px;"/></figure>` : ""}
      <div class="entry-content rich-content">${sanitizeHtml(post.contentHtml)}</div>
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
