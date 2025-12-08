"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus("success");
          setMessage("Your email is confirmed. You can sign in now.");
        } else {
          const data = await res.json();
          setStatus("error");
          setMessage(data?.error || "This link is no longer valid.");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to verify your email. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">ShopEverywhere</p>
        <h1 className="text-3xl font-bold text-gray-900">Email verification</h1>
        <p className="text-gray-600">{message}</p>
        {status === "loading" && <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />}
        {status === "success" && (
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go to login
          </button>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="inline-flex w-full justify-center rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to login
            </Link>
            <p className="text-xs text-gray-500">
              Need a new link? Register again or contact support at{" "}
              <a href="mailto:support@shopeverywhere.com" className="text-indigo-600">
                support@shopeverywhere.com
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}







