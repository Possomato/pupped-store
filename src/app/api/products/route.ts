import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sizes: z.array(z.number().int().positive()),
  isActive: z.boolean().optional().default(true),
  articleId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

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

    return NextResponse.json(productsWithImages);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const [newProduct] = await db
      .insert(products)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        sizes: validatedData.sizes,
        isActive: validatedData.isActive,
        articleId: validatedData.articleId ?? null,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
