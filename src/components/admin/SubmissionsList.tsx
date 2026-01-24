"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  contactType: string;
  contactValue: string;
  message: string | null;
  status: string;
  createdAt: Date;
  productId: string;
  productTitle: string | null;
}

interface SubmissionsListProps {
  initialSubmissions: Submission[];
}

const statusOptions = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
];

export default function SubmissionsList({ initialSubmissions }: SubmissionsListProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
                    submission.status
                  )}`}
                >
                  {statusOptions.find((s) => s.value === submission.status)?.label}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(submission.createdAt)}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                Product:{" "}
                <span className="text-gray-900 font-medium">
                  {submission.productTitle || "Unknown"}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {submission.contactType === "instagram" ? "Instagram:" : "WhatsApp:"}
                </span>
                <span className="text-gray-900 font-medium">
                  {submission.contactValue}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(submission.contactValue)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>

              {submission.message && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{submission.message}</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <select
                value={submission.status}
                onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                disabled={updating === submission.id}
                className="block w-full md:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:opacity-50"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
