import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, images } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { z } from "zod";
import { uploadImage } from "@/lib/r2/client";

const articleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  body: z.string().min(1),
  published: z.boolean().optional().default(false),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") === "true";

    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        coverImageId: articles.coverImageId,
        body: articles.body,
        published: articles.published,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles);

    if (publishedOnly) {
      query = query.where(eq(articles.published, true)) as typeof query;
    }

    const allArticles = await query.orderBy(desc(articles.createdAt));

    const articlesWithImages = await Promise.all(
      allArticles.map(async (article) => {
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

    return NextResponse.json(articlesWithImages);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const slugInput = formData.get("slug") as string;
    const body = formData.get("body") as string;
    const published = formData.get("published") === "true";
    const coverImageFile = formData.get("coverImage") as File | null;

    const slug = slugInput || generateSlug(title);

    const validatedData = articleSchema.parse({
      title,
      slug,
      body,
      published,
    });

    let coverImageId: string | null = null;

    if (coverImageFile && coverImageFile.size > 0) {
      const buffer = Buffer.from(await coverImageFile.arrayBuffer());
      const { key } = await uploadImage(buffer, coverImageFile.name, coverImageFile.type, "articles");

      const [newImage] = await db
        .insert(images)
        .values({
          r2Key: key,
          originalName: coverImageFile.name,
          mimeType: coverImageFile.type,
          size: buffer.length,
        })
        .returning();

      coverImageId = newImage.id;
    }

    const [newArticle] = await db
      .insert(articles)
      .values({
        title: validatedData.title,
        slug: validatedData.slug,
        body: validatedData.body,
        published: validatedData.published,
        coverImageId,
      })
      .returning();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
