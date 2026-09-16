import { notFound } from "next/navigation";
import { WpMain, WpShell } from "@/components/WpShell";
import { readPageHtml } from "@/lib/wpPages";

export function WpPage({ slug, title }: { slug: string; title?: string }) {
  const html = readPageHtml(slug);
  if (!html) notFound();
  return (
    <WpShell>
      {title ? <title>{title}</title> : null}
      <WpMain html={html} />
    </WpShell>
  );
}
