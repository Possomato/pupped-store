import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { deleteImage } from "@/lib/r2/client";

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

    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, id));

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from R2
    try {
      await deleteImage(image.r2Key);
    } catch (err) {
      console.error("Failed to delete from R2:", err);
    }

    // Delete from database
    await db.delete(productImages).where(eq(productImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
