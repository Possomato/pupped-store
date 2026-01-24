export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { products, contactSubmissions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [productCount] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.isActive, true));

  const [submissionCount] = await db
    .select({ count: count() })
    .from(contactSubmissions)
    .where(eq(contactSubmissions.status, "new"));

  const stats = [
    {
      label: "Active Products",
      value: productCount?.count ?? 0,
      href: "/admin/products",
    },
    {
      label: "New Submissions",
      value: submissionCount?.count ?? 0,
      href: "/admin/submissions",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Add New Product
        </Link>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          View Store
        </Link>
      </div>
    </div>
  );
}
