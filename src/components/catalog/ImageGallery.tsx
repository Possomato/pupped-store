"use client";

import { useState } from "react";
import { ProductImage } from "@/lib/db/schema";

interface ImageGalleryProps {
  images: ProductImage[];
  productTitle: string;
  r2PublicUrl: string;
}

export default function ImageGallery({
  images,
  productTitle,
  r2PublicUrl,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <svg
          className="h-20 w-20 text-gray-300"
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
    );
  }

  const getImageUrl = (key: string) => `${r2PublicUrl}/${key}`;

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <img
          src={getImageUrl(images[selectedIndex].r2Key)}
          alt={`${productTitle} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition ${
                selectedIndex === index
                  ? "ring-2 ring-gray-900"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={getImageUrl(image.r2Key)}
                alt={`${productTitle} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
