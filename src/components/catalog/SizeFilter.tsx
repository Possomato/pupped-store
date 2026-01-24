"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SizeFilterProps {
  availableSizes: number[];
}

export default function SizeFilter({ availableSizes }: SizeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSize = searchParams.get("size");

  const handleSizeClick = (size: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (size === null || activeSize === String(size)) {
      params.delete("size");
    } else {
      params.set("size", String(size));
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <span className="text-sm text-gray-500 whitespace-nowrap">Size:</span>
      <div className="flex gap-2">
        <button
          onClick={() => handleSizeClick(null)}
          className={`px-3 py-1.5 text-sm rounded-full transition whitespace-nowrap ${
            !activeSize
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {availableSizes.map((size) => (
          <button
            key={size}
            onClick={() => handleSizeClick(size)}
            className={`px-3 py-1.5 text-sm rounded-full transition whitespace-nowrap ${
              activeSize === String(size)
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
