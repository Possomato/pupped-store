import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { uploadImage, deleteImage } from "@/lib/r2/client";
import { z } from "zod";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  body: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by slug
    let [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));

    if (!article) {
      [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, id));
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    let coverImage = null;
    if (article.coverImageId) {
      const [img] = await db
        .select()
        .from(images)
        .where(eq(images.id, article.coverImageId));
      coverImage = img || null;
    }

    return NextResponse.json({ ...article, coverImage });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get("title") as string | null;
    const slug = formData.get("slug") as string | null;
    const body = formData.get("body") as string | null;
    const publishedStr = formData.get("published") as string | null;
    const coverImageFile = formData.get("coverImage") as File | null;
    const removeCoverImage = formData.get("removeCoverImage") === "true";

    const updateData: Record<string, unknown> = {};
    if (title !== null) updateData.title = title;
    if (slug !== null) updateData.slug = slug;
    if (body !== null) updateData.body = body;
    if (publishedStr !== null) updateData.published = publishedStr === "true";

    const validatedData = updateArticleSchema.parse(updateData);

    // Get current article
    const [currentArticle] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));

    if (!currentArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    let coverImageId = currentArticle.coverImageId;

    // Handle cover image removal
    if (removeCoverImage && currentArticle.coverImageId) {
      const [oldImage] = await db
        .select()
        .from(images)
        .where(eq(images.id, currentArticle.coverImageId));

      if (oldImage) {
        try {
          await deleteImage(oldImage.r2Key);
        } catch (err) {
          console.error("Failed to delete old cover image:", err);
        }
        await db.delete(images).where(eq(images.id, oldImage.id));
      }
      coverImageId = null;
    }

    // Handle new cover image upload
    if (coverImageFile && coverImageFile.size > 0) {
      // Delete old image if exists
      if (currentArticle.coverImageId) {
        const [oldImage] = await db
          .select()
          .from(images)
          .where(eq(images.id, currentArticle.coverImageId));

        if (oldImage) {
          try {
            await deleteImage(oldImage.r2Key);
          } catch (err) {
            console.error("Failed to delete old cover image:", err);
          }
          await db.delete(images).where(eq(images.id, oldImage.id));
        }
      }

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

    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...validatedData,
        coverImageId,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();

    return NextResponse.json(updatedArticle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get article with cover image
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Delete cover image from R2 if exists
    if (article.coverImageId) {
      const [coverImage] = await db
        .select()
        .from(images)
        .where(eq(images.id, article.coverImageId));

      if (coverImage) {
        try {
          await deleteImage(coverImage.r2Key);
        } catch (err) {
          console.error("Failed to delete cover image:", err);
        }
        await db.delete(images).where(eq(images.id, coverImage.id));
      }
    }

    // Delete article
    await db.delete(articles).where(eq(articles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
