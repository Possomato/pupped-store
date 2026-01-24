import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth/session";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

export async function PATCH(
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
    const { status } = updateSchema.parse(body);

    const [updated] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
