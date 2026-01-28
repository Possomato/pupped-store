export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { articles, images } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Header from "@/components/catalog/Header";
import ArticleCard from "@/components/catalog/ArticleCard";

export default async function HistoryPage() {
  const publishedArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.createdAt));

  const articlesWithImages = await Promise.all(
    publishedArticles.map(async (article) => {
      let coverImage = null;
      if (article.coverImageId) {
        const [img] = await db
          .select()
          .from(images)
          .where(eq(images.id, article.coverImageId));
        coverImage = img || null;
      }
      return { ...article, coverImage };
    })
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Sneaker History
        </h1>

        {articlesWithImages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No articles published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {articlesWithImages.map((article) => (
              <ArticleCard key={article.id} article={article} />
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
