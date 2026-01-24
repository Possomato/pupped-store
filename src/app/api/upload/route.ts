import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/session";
import { uploadImage } from "@/lib/r2/client";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { key, url } = await uploadImage(buffer, file.name, file.type);

    // Get current max sort order for this product
    const existingImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));

    const maxSortOrder = existingImages.reduce(
      (max, img) => Math.max(max, img.sortOrder),
      -1
    );

    const [newImage] = await db
      .insert(productImages)
      .values({
        productId,
        r2Key: key,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        sortOrder: maxSortOrder + 1,
      })
      .returning();

    return NextResponse.json({ ...newImage, url }, { status: 201 });
  } catch (error) {
    console.error("Error uploading image:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
