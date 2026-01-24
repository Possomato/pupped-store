"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/submissions", label: "Submissions" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="text-xl font-semibold italic text-gray-900"
              style={{ fontFamily: "Cambria, serif" }}
            >
              PUPPED
            </Link>
            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              Admin
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  pathname === item.href
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
