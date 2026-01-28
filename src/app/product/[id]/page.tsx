export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { products, productImages, articles, images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Header from "@/components/catalog/Header";
import ImageGallery from "@/components/catalog/ImageGallery";
import ContactForm from "@/components/catalog/ContactForm";
import ArticlePreview from "@/components/catalog/ArticlePreview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id));

  if (!product) {
    return { title: "Product Not Found - PUPPED" };
  }

  return {
    title: `${product.title} - PUPPED`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product || !product.isActive) {
    notFound();
  }

  const productImagesData = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.sortOrder);

  // Fetch linked article if exists
  let linkedArticle = null;
  if (product.articleId) {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, product.articleId));

    if (article && article.published) {
      let coverImage = null;
      if (article.coverImageId) {
        const [img] = await db
          .select()
          .from(images)
          .where(eq(images.id, article.coverImageId));
        coverImage = img || null;
      }
      linkedArticle = { ...article, coverImage };
    }
  }

  const sizes = product.sizes as number[];
  const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <ImageGallery
              images={productImagesData}
              productTitle={product.title}
              r2PublicUrl={r2PublicUrl}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                {product.title}
              </h1>
              <p className="text-2xl text-gray-900">${product.price}</p>
            </div>

            {sizes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">
                  Available Sizes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {linkedArticle && (
              <ArticlePreview article={linkedArticle} />
            )}

            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Interested in this product?
              </h2>
              <ContactForm productId={product.id} productTitle={product.title} />
            </div>
          </div>
        </div>
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
