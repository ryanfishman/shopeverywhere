"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/admin/zones", label: "Zones" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          ShopEverywhere
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "block rounded-md px-3 py-2 text-sm font-medium",
              pathname?.startsWith(link.href)
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};








