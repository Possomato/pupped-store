export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { contactSubmissions, products } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import SubmissionsList from "@/components/admin/SubmissionsList";

export default async function SubmissionsPage() {
  const submissions = await db
    .select({
      id: contactSubmissions.id,
      contactType: contactSubmissions.contactType,
      contactValue: contactSubmissions.contactValue,
      message: contactSubmissions.message,
      status: contactSubmissions.status,
      createdAt: contactSubmissions.createdAt,
      productId: contactSubmissions.productId,
      productTitle: products.title,
    })
    .from(contactSubmissions)
    .leftJoin(products, eq(contactSubmissions.productId, products.id))
    .orderBy(desc(contactSubmissions.createdAt));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Submissions</h1>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No submissions yet.</p>
        </div>
      ) : (
        <SubmissionsList initialSubmissions={submissions} />
      )}
    </div>
  );
}
