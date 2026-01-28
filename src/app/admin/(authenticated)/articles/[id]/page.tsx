export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { articles, images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article] = await db.select().from(articles).where(eq(articles.id, id));

  if (!article) {
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Article</h1>
      <ArticleForm article={{ ...article, coverImage }} mode="edit" />
    </div>
  );
}
