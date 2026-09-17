import Link from "next/link";
import { getPosts } from "@/lib/posts";

const PAGE_SIZE = 12;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function NewsIndex({ page = 1 }: { page?: number }) {
  const posts = getPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const slice = posts.slice(start, start + PAGE_SIZE);

  return (
    <>
    <link rel="stylesheet" href="/wp-mirror/css/page-styles/news.css?v=renacon-remaining-pages-202609171500" />
    <main id="main" className="site-main news-index">
      <div className="hero-section" data-type="type-2">
        <header className="entry-header ct-container-narrow">
          <h1 className="page-title">News</h1>
          <p className="news-index-count">{posts.length} articles</p>
        </header>
      </div>

      <div className="ct-container news-index-wrap" data-vertical-spacing="top:bottom">
        <section className="news-index-grid" aria-label="News articles">
          {slice.map((post) => {
            const excerpt = stripTags(post.excerpt || post.contentHtml).slice(0, 160);
            return (
              <article key={post.slug} className="news-card">
                <Link href={`/news/${post.slug}/`} className="news-card-media" aria-label={post.title}>
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image} alt="" loading="lazy" />
                  ) : (
                    <span className="news-card-placeholder" />
                  )}
                </Link>
                <div className="news-card-body">
                  <time className="news-card-date" dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h2 className="news-card-title">
                    <Link href={`/news/${post.slug}/`}>{post.title}</Link>
                  </h2>
                  {excerpt ? <p className="news-card-excerpt">{excerpt}…</p> : null}
                  <Link href={`/news/${post.slug}/`} className="news-card-link">
                    Read More
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {totalPages > 1 ? (
          <nav className="news-pagination" aria-label="News pagination">
            {current > 1 ? (
              <Link
                className="page-numbers prev"
                href={current === 2 ? "/news/" : `/news/page/${current - 1}/`}
              >
                Previous
              </Link>
            ) : null}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - current) <= 2)
              .reduce<Array<number | "dots">>((acc, n, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1] as number;
                  if (n - prev > 1) acc.push("dots");
                }
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "dots" ? (
                  <span key={`d-${idx}`} className="page-numbers dots">
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    className={`page-numbers${item === current ? " current" : ""}`}
                    href={item === 1 ? "/news/" : `/news/page/${item}/`}
                    aria-current={item === current ? "page" : undefined}
                  >
                    {item}
                  </Link>
                ),
              )}
            {current < totalPages ? (
              <Link className="page-numbers next" href={`/news/page/${current + 1}/`}>
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
    </>
  );
}
