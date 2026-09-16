import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPosts } from "@/lib/posts";

export const metadata = { title: "News" };

export default function NewsPage() {
  const posts = getPosts();
  return (
    <>
      <PageHero
        title="News & blogs"
        subtitle="Official Renacon updates, factory events, expos and construction insights."
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/news/${post.slug}`}
            className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            {post.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image} alt="" className="h-48 w-full object-cover" />
            ) : (
              <div className="h-32 bg-emerald-100" />
            )}
            <div className="p-5">
              <p className="text-xs text-emerald-700">{post.date}</p>
              <h2 className="mt-2 font-semibold leading-snug">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
