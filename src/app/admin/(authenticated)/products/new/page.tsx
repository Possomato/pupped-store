import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const publishedArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.published, true));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Add New Product
      </h1>
      <ProductForm mode="create" articles={publishedArticles} />
    </div>
  );
}
