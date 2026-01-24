export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { db } from "@/lib/db";
import { products, productImages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Header from "@/components/catalog/Header";
import SizeFilter from "@/components/catalog/SizeFilter";
import ProductCard from "@/components/catalog/ProductCard";

interface HomeProps {
  searchParams: Promise<{ size?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { size } = await searchParams;
  const sizeFilter = size ? parseInt(size, 10) : null;

  // Get all active products
  let allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt));

  // Filter by size if specified
  if (sizeFilter) {
    allProducts = allProducts.filter((product) =>
      (product.sizes as number[]).includes(sizeFilter)
    );
  }

  // Get images for products
  const productsWithImages = await Promise.all(
    allProducts.map(async (product) => {
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder);
      return { ...product, images };
    })
  );

  // Get all unique sizes for filtering
  const allSizes = new Set<number>();
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  activeProducts.forEach((product) => {
    (product.sizes as number[]).forEach((s) => allSizes.add(s));
  });

  const availableSizes = Array.from(allSizes).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableSizes.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<div className="h-10" />}>
              <SizeFilter availableSizes={availableSizes} />
            </Suspense>
          </div>
        )}

        {productsWithImages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {sizeFilter
                ? `No products available in size ${sizeFilter}`
                : "No products available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {productsWithImages.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p
            className="text-center text-sm text-gray-500 italic"
            style={{ fontFamily: "Cambria, Georgia, serif" }}
          >
            PUPPED
          </p>
        </div>
      </footer>
    </div>
  );
}
