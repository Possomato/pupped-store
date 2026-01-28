"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductImage, Article } from "@/lib/db/schema";

interface ProductFormProps {
  product?: Product & { images: ProductImage[] };
  articles?: Article[];
  mode: "create" | "edit";
}

const COMMON_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];

export default function ProductForm({ product, articles = [], mode }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [sizes, setSizes] = useState<number[]>(
    (product?.sizes as number[]) || []
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [articleId, setArticleId] = useState<string | null>(product?.articleId || null);
  const [images, setImages] = useState<
    Array<{ id: string; url: string; r2Key: string }>
  >(
    product?.images.map((img) => ({
      id: img.id,
      url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${img.r2Key}`,
      r2Key: img.r2Key,
    })) || []
  );

  const handleSizeToggle = (size: number) => {
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    );
  };

  const handleImageUpload = useCallback(
    async (files: FileList) => {
      if (!product?.id && mode === "create") {
        setError("Please save the product first before uploading images");
        return;
      }

      setUploadingImages(true);
      setError("");

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", product!.id);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }

          const data = await res.json();
          setImages((prev) => [
            ...prev,
            { id: data.id, url: data.url, r2Key: data.r2Key },
          ]);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        }
      }

      setUploadingImages(false);
    },
    [product?.id, mode]
  );

  const handleImageDelete = async (imageId: string) => {
    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete image");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = {
      title,
      description,
      price,
      sizes,
      isActive,
      articleId,
    };

    try {
      const url =
        mode === "create" ? "/api/products" : `/api/products/${product!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save product");
      }

      const savedProduct = await res.json();

      if (mode === "create") {
        router.push(`/admin/products/${savedProduct.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product!.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Product Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="Product title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
            placeholder="Product description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              pattern="^\d+(\.\d{1,2})?$"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sizes.includes(size)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Product is active (visible in catalog)
          </label>
        </div>

        {articles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Article
            </label>
            <select
              value={articleId || ""}
              onChange={(e) => setArticleId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
            >
              <option value="">None</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Link a history article to show on this product&apos;s page
            </p>
          </div>
        )}
      </div>

      {mode === "edit" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Images</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-square">
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(image.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition"
                >
                  <svg
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) =>
                  e.target.files && handleImageUpload(e.target.files)
                }
                className="hidden"
                disabled={uploadingImages}
              />
              {uploadingImages ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="mt-2 text-sm text-gray-500">Add Images</span>
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {mode === "create" && (
        <p className="text-sm text-gray-500">
          Save the product first to add images.
        </p>
      )}

      <div className="flex justify-between">
        <div>
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              Delete Product
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
