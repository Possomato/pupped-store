import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendContactNotification } from "@/lib/email/send";
import { z } from "zod";

const contactSchema = z.object({
  productId: z.string().uuid(),
  contactType: z.enum(["instagram", "whatsapp"]),
  contactValue: z
    .string()
    .min(1)
    .max(100)
    .refine(
      (val) => {
        // Basic validation for Instagram or WhatsApp
        return val.length >= 2;
      },
      { message: "Invalid contact value" }
    ),
  message: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Verify product exists and is active
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, validatedData.productId));

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Clean contact value
    let cleanedContactValue = validatedData.contactValue.trim();
    if (validatedData.contactType === "instagram") {
      // Remove @ if present at the start, then add it back for consistency
      cleanedContactValue = cleanedContactValue.replace(/^@/, "");
      cleanedContactValue = `@${cleanedContactValue}`;
    }

    // Save submission to database
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        productId: validatedData.productId,
        contactType: validatedData.contactType,
        contactValue: cleanedContactValue,
        message: validatedData.message || null,
      })
      .returning();

    // Send email notification (don't fail the request if email fails)
    try {
      await sendContactNotification({
        productTitle: product.title,
        contactType: validatedData.contactType,
        contactValue: cleanedContactValue,
        message: validatedData.message,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
