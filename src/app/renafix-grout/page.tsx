import Link from "next/link";

export const metadata = { title: "Renafix grout" };

export default function GroutIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Renafix grout</h1>
      <ul className="mt-6 space-y-3 text-emerald-800">
        <li>
          <Link href="/renafix-tile-grout">Renafix Tile Grout (300S)</Link>
        </li>
        <li>
          <Link href="/renafix-gp-grout">Renafix GP Grout</Link>
        </li>
      </ul>
    </div>
  );
}
