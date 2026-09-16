import { PageHero } from "@/components/PageHero";
import { getProjects } from "@/lib/gallery";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHero
        title="Our projects"
        subtitle="Have a look at paramount sustainable projects built with Renacon AAC blocks across South India, Kerala, Maldives and beyond."
      />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <figure key={p.image} className="overflow-hidden rounded-3xl bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.title} className="h-56 w-full object-cover" />
            <figcaption className="p-4 text-sm font-medium capitalize">{p.title}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
