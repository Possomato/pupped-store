"use client";

import { useState } from "react";

interface ContactFormProps {
  productId: string;
  productTitle: string;
}

export default function ContactForm({ productId, productTitle }: ContactFormProps) {
  const [contactType, setContactType] = useState<"instagram" | "whatsapp">("instagram");
  const [contactValue, setContactValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          contactType,
          contactValue,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setContactValue("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <svg
          className="h-12 w-12 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h3 className="text-lg font-medium text-green-900 mb-2">
          Message Sent!
        </h3>
        <p className="text-green-700 text-sm">
          We&apos;ll reach out to you about {productTitle} soon.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How should we contact you?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setContactType("instagram")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              contactType === "instagram"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={() => setContactType("whatsapp")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              contactType === "whatsapp"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="contactValue"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {contactType === "instagram" ? "Instagram Handle" : "WhatsApp Number"}
        </label>
        <input
          id="contactValue"
          type="text"
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          required
          placeholder={contactType === "instagram" ? "@yourusername" : "+1234567890"}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message (optional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Any questions or specific requests?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Sending..." : "Get in Touch"}
      </button>
    </form>
  );
}
