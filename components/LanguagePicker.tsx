"use client";

import { useState } from "react";

import { LANGUAGES } from "@/lib/i18n";

type LanguagePickerProps = {
  locale: string;
  onChange: (locale: string) => void;
};

export const LanguagePicker = ({ locale, onChange }: LanguagePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="uppercase font-medium text-sm flex items-center gap-1">
        {locale}
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full bg-white border rounded shadow-lg w-20 z-50">
      {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => {
                onChange(l);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 uppercase"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

