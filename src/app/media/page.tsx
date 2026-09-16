import { PageHero } from "@/components/PageHero";
import { MEDIA_VIDEOS } from "@/data/site";
import { getMedia } from "@/lib/gallery";

export const metadata = { title: "Media" };

export default function MediaPage() {
  const photos = getMedia();
  return (
    <>
      <PageHero title="Media" subtitle="Brochures, press coverage, expos and official product films." />
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Product films</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {MEDIA_VIDEOS.map((v) => (
            <figure key={v.src} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <iframe
                title={v.title}
                src={v.src}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <figcaption className="p-4 text-sm font-medium">{v.title}</figcaption>
            </figure>
          ))}
        </div>
        <h2 className="mt-14 text-2xl font-semibold">Gallery &amp; press</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <figure key={p.image} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.title} className="h-56 w-full object-cover" />
              <figcaption className="p-4 text-sm capitalize">{p.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
