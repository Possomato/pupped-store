export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products, productImages, articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, id));

  if (!product) {
    notFound();
  }

  const [productImagesData, publishedArticles] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder),
    db
      .select()
      .from(articles)
      .where(eq(articles.published, true)),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Product</h1>
      <ProductForm
        product={{ ...product, images: productImagesData }}
        articles={publishedArticles}
        mode="edit"
      />
    </div>
  );
}
