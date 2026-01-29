export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { articles, images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Header from "@/components/catalog/Header";
import { getImageUrl } from "@/lib/r2/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug));

  if (!article) {
    return { title: "Article Not Found - PUPPED" };
  }

  return {
    title: `${article.title} - PUPPED History`,
    description: article.body.slice(0, 160).replace(/<[^>]*>/g, ""),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug));

  if (!article || !article.published) {
    notFound();
  }

  let coverImage = null;
  if (article.coverImageId) {
    const [img] = await db
      .select()
      .from(images)
      .where(eq(images.id, article.coverImageId));
    coverImage = img || null;
  }

  const coverImageUrl = coverImage ? getImageUrl(coverImage.r2Key) : null;

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        .article-body img {
          display: block;
          width: 80%;
          max-width: 80%;
          margin: 1.5rem auto;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 0.5rem;
        }
      `}</style>
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/history"
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
          Back to History
        </Link>

        {coverImageUrl && (
          <div className="aspect-[2/1] rounded-2xl overflow-hidden mb-8">
            <img
              src={coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl font-semibold text-gray-900 mb-8">
          {article.title}
        </h1>

        <article
          className="article-body prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-gray-900 prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
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
