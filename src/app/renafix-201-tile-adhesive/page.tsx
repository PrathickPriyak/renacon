import { ProductPage } from "@/components/ProductPage";
import { getProduct } from "@/data/products";
import { notFound } from "next/navigation";

const product = getProduct("renafix-201-tile-adhesive");

export const metadata = { title: product?.name ?? "Product" };

export default function Page() {
  if (!product) notFound();
  return <ProductPage product={product} />;
}
