import { Calculators } from "@/components/Calculators";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Calculator" };

export default function CalculatorPage() {
  return (
    <>
      <PageHero
        title="Calculator"
        subtitle="Estimate Renacon AAC blocks, Renaplast plaster and Renabond joint mortar for your wall area."
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <Calculators />
      </div>
    </>
  );
}
