"use client";

import { useState, useEffect, useRef } from "react";

import { LANGUAGES } from "@/lib/i18n";

type LanguagePickerProps = {
  locale: string;
  onChange: (locale: string) => void;
  variant?: "light" | "dark"; // light = for dark backgrounds, dark = for light backgrounds
};

export const LanguagePicker = ({ locale, onChange, variant = "light" }: LanguagePickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const buttonClass = variant === "light" 
    ? "uppercase font-medium text-sm flex items-center gap-1 text-white/80 hover:text-amber-400 transition-colors"
    : "uppercase font-medium text-sm flex items-center gap-1 text-slate-700 hover:text-amber-600 transition-colors";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className={buttonClass}>
        {locale}
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-lg w-20 z-50">
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => {
                onChange(l);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 uppercase text-slate-700"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

