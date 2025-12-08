"use client";

import { ReactNode } from "react";
import { AdminTopNav } from "@/components/AdminTopNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-stone-50 to-slate-100">
      <AdminTopNav />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
