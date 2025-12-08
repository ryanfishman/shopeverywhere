"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { AccountDropdown } from "@/components/AccountDropdown";
import { LanguagePicker } from "@/components/LanguagePicker";

type NavbarProps = {
  locale?: string;
  onLocaleChange?: (locale: string) => void;
};

export function Navbar({ locale = "en", onLocaleChange }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              ShopEverywhere
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {onLocaleChange && (
              <div className="hidden sm:block">
                <LanguagePicker locale={locale} onChange={onLocaleChange} />
              </div>
            )}
            <Link href="/cart" className="text-gray-600 hover:text-indigo-600">
              <ShoppingCart className="h-6 w-6" />
            </Link>
            <AccountDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}





