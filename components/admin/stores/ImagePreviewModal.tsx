"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden bg-slate-800">
          <Image
            src={imageUrl}
            alt="Product image"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}



