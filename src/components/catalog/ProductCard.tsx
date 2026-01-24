import Link from "next/link";
import { Product, ProductImage } from "@/lib/db/schema";
import { getImageUrl } from "@/lib/r2/client";

interface ProductCardProps {
  product: Product & { images: ProductImage[] };
}

export default function ProductCard({ product }: ProductCardProps) {
  const thumbnail = product.images[0]
    ? getImageUrl(product.images[0].r2Key)
    : null;
  const sizes = product.sizes as number[];

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.title}
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">
        {product.title}
      </h3>
      <p className="text-base text-gray-900 mb-2">${product.price}</p>
      {sizes.length > 0 && (
        <p className="text-sm text-gray-500">
          Sizes: {sizes.join(", ")}
        </p>
      )}
    </Link>
  );
}
