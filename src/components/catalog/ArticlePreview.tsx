import Link from "next/link";
import { Article, Image } from "@/lib/db/schema";
import { getImageUrl } from "@/lib/r2/client";

interface ArticlePreviewProps {
  article: Article & { coverImage: Image | null };
}

export default function ArticlePreview({ article }: ArticlePreviewProps) {
  const thumbnail = article.coverImage
    ? getImageUrl(article.coverImage.r2Key)
    : null;

  return (
    <Link
      href={`/history/${article.slug}`}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Related History
        </p>
        <p className="text-sm font-medium text-gray-900 group-hover:underline line-clamp-1">
          {article.title}
        </p>
      </div>
      <svg
        className="h-5 w-5 text-gray-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
