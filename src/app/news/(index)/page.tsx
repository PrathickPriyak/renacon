import { WpShell } from "@/components/WpShell";
import { NewsIndex } from "@/components/NewsIndex";

export const metadata = { title: "News" };

export default function Page() {
  return (
    <WpShell>
      <NewsIndex page={1} />
    </WpShell>
  );
}
