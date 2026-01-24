import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-12 items-center">
          <Link
            href="/"
            className="text-xl font-semibold italic text-gray-900 tracking-tight"
            style={{ fontFamily: "Cambria, Georgia, serif" }}
          >
            PUPPED
          </Link>
        </div>
      </div>
    </header>
  );
}
