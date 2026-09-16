import Link from "next/link";

export const metadata = { title: "Renafix tile adhesive" };

export default function TileAdhesiveIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Renafix tile adhesive</h1>
      <ul className="mt-6 space-y-3 text-emerald-800">
        <li>
          <Link href="/renafix-201-tile-adhesive">Renafix 201</Link>
        </li>
        <li>
          <Link href="/renafix-211">Renafix 211</Link>
        </li>
        <li>
          <Link href="/renafix-222-tile-adhesive">Renafix 222</Link>
        </li>
        <li>
          <Link href="/renafix-333">Renafix 333</Link>
        </li>
        <li>
          <Link href="/renafix-tile-adhesive-444">Renafix 444</Link>
        </li>
      </ul>
    </div>
  );
}
