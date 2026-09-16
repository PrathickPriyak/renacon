import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getProduct } from "@/data/products";

const product = getProduct("renafix-201-tile-adhesive");

export const metadata = { title: "Renafix 201 TDS" };

export default function Page() {
  const steps = product?.methodology?.[0]?.steps ?? [
    "Surfaces should be structurally sound, clean and free of dirt, oil, grease, laitance and curing compounds.",
    "Mix approximately 5–6 L of potable water per 20 kg of powder to a smooth trowelable consistency. Slake 5–10 minutes.",
    "Apply with the flat side of the trowel, then comb with the notched side. Cover tiles within 10 minutes.",
    "Back-butter tiles larger than 12×12 inches. Beat in with a rubber mallet. Fill joints with Renafix tile grout.",
    "Clean tools with water immediately. Do not use adhesive that has skinned over.",
  ];
  return (
    <>
      <PageHero title="Renafix 201 TDS" subtitle="Installation guidance sourced from the official Renacon product pages." />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-xl font-semibold">Preparation &amp; installation</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {product ? (
          <p className="mt-8">
            <Link className="font-semibold text-emerald-700" href={product.href}>
              Back to {product.name}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
