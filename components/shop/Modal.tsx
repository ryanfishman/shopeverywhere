"use client";

import { X } from "lucide-react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal = ({ title, children, onClose }: ModalProps) => (
  <div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
      <div className="flex justify-between items-center p-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

