import { notFound } from "next/navigation";
import { WpShell } from "@/components/WpShell";
import { NewsIndex } from "@/components/NewsIndex";
import { getPosts } from "@/lib/posts";

const PAGE_SIZE = 12;

type Params = { page: string };

export function generateStaticParams() {
  const total = Math.ceil(getPosts().length / PAGE_SIZE);
  return Array.from({ length: Math.max(total - 1, 0) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return { title: `News – Page ${page}` };
}

export default async function NewsPaged({ params }: { params: Promise<Params> }) {
  const { page: pageStr } = await params;
  const page = Number(pageStr);
  const totalPages = Math.max(1, Math.ceil(getPosts().length / PAGE_SIZE));
  if (!Number.isFinite(page) || page < 2 || page > totalPages) notFound();

  return (
    <WpShell>
      <NewsIndex page={page} />
    </WpShell>
  );
}
