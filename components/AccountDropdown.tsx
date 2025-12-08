"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export const AccountDropdown = () => {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const firstName = session?.user?.name?.split(" ")[0];

  if (!session?.user) {
    return (
      <Link href="/auth/login" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-sm font-medium focus:outline-none">
        <span className="hidden sm:inline">{firstName}</span>
        <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold capitalize">
          {firstName?.[0] ?? "U"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
          <Link href="/account" className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
            My Details
          </Link>
          <Link href="/orders" className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
            Previous Orders
          </Link>
          <div className="border-t" />
          <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};






