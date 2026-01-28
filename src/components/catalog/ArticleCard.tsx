import Link from "next/link";
import { Article, Image } from "@/lib/db/schema";
import { getImageUrl } from "@/lib/r2/client";

interface ArticleCardProps {
  article: Article & { coverImage: Image | null };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const thumbnail = article.coverImage
    ? getImageUrl(article.coverImage.r2Key)
    : null;

  return (
    <Link href={`/history/${article.slug}`} className="group block">
      <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-base font-medium text-gray-900 line-clamp-2 group-hover:underline">
        {article.title}
      </h3>
    </Link>
  );
}
