import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
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
  return (
    <>
      <PageHero title={post.title} subtitle={post.date} />
      <article className="mx-auto max-w-3xl px-4 py-12">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" className="mb-8 w-full rounded-3xl object-cover" />
        ) : null}
        <div
          className="rich-content space-y-4 text-base leading-7 text-slate-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHtml) }}
        />
        <p className="mt-10">
          <Link href="/news" className="font-semibold text-emerald-700">
            ← All news
          </Link>
        </p>
      </article>
    </>
  );
}
