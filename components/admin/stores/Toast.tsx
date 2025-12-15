"use client";

import clsx from "clsx";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  toast: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 z-[90] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all animate-slide-in-left",
        toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      )}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}



