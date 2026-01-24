import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { deleteImage } from "@/lib/r2/client";
import { z } from "zod";

const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  sizes: z.array(z.number().int().positive()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder);

    return NextResponse.json({ ...product, images });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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

    // Get and delete associated images from R2
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id));

    for (const image of images) {
      try {
        await deleteImage(image.r2Key);
      } catch (err) {
        console.error(`Failed to delete image ${image.r2Key}:`, err);
      }
    }

    // Delete product (cascade will delete image records)
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
