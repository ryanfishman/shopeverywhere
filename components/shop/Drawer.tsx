"use client";

import { X } from "lucide-react";

interface DrawerProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
  side?: "left" | "right";
}

export const Drawer = ({ title, children, onClose, isOpen, side = "right" }: DrawerProps) => {
  const isLeft = side === "left";
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 ${isLeft ? 'left-0' : 'right-0'} w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen
            ? 'translate-x-0'
            : isLeft ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};



