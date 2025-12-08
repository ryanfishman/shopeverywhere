"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Map, Building2, FolderTree, Users, Menu, ShieldCheck } from "lucide-react";
import clsx from "clsx";

import { LanguagePicker } from "@/components/LanguagePicker";
import { AccountDropdown } from "@/components/AccountDropdown";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

const links = [
  { href: "/admin/zones", label: "Zones", icon: Map },
  { href: "/admin/stores", label: "Stores", icon: Building2 },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const AdminTopNav = () => {
  const pathname = usePathname();
  const { locale, setLocale } = usePreferredLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderLink = (link: (typeof links)[number], showLabel: boolean) => {
    const Icon = link.icon;
    const active = pathname?.startsWith(link.href);

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          active
            ? "bg-amber-500/20 text-amber-300"
            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
        )}
        title={link.label}
      >
        <Icon className={clsx("h-5 w-5", active ? "text-amber-400" : "text-slate-400")} />
        {showLabel && <span>{link.label}</span>}
        <span className="sr-only">{link.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">ShopEverywhere</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Admin</span>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-300 hover:bg-slate-700/50 hover:text-white md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => renderLink(link, false))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguagePicker locale={locale} onChange={setLocale} />
            <AccountDropdown />
          </div>
        </div>
      </nav>

      {/* Mobile drawer - outside nav to avoid backdrop-blur inheritance */}
      {mobileOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
            className="md:hidden backdrop-blur-sm"
          />
          {/* Slide-out drawer */}
          <div
            className="md:hidden animate-slide-in-left"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              zIndex: 9999,
              background: "linear-gradient(to bottom, #1e293b, #0f172a)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="flex h-16 items-center border-b border-slate-700/50 px-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SE</span>
                </div>
                <span className="text-lg font-bold text-white">Admin</span>
              </Link>
            </div>
            <div className="flex flex-col gap-1 p-4">
              {links.map((link) => renderLink(link, true))}
            </div>
          </div>
        </>
      )}
    </>
  );
};


