import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/session";
import { uploadImage } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await uploadImage(
      buffer,
      file.name,
      file.type,
      "articles"
    );

    await db.insert(images).values({
      r2Key: key,
      originalName: file.name,
      mimeType: file.type,
      size: buffer.length,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid file type")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("File too large")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error uploading article image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
