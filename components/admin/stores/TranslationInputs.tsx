"use client";

import { LANGUAGES } from "@/lib/i18n";

interface TranslationInputsProps {
  field: "translations" | "shortDescription" | "longDescription";
  value: Record<string, string>;
  onChange: (field: "translations" | "shortDescription" | "longDescription", lang: string, value: string) => void;
  label: string;
  isTextarea?: boolean;
  placeholder?: string;
}

export function TranslationInputs({
  field,
  value,
  onChange,
  label,
  isTextarea = false,
  placeholder,
}: TranslationInputsProps) {
  return (
    <div className="space-y-3">
      {LANGUAGES.map((lang) => (
        <div key={lang} className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase flex-shrink-0 mt-0.5">
            {lang}
          </span>
          {isTextarea ? (
            <textarea
              value={value[lang] || ""}
              onChange={(e) => onChange(field, lang, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500 resize-none"
              rows={2}
              placeholder={placeholder || `${label} in ${lang.toUpperCase()}`}
            />
          ) : (
            <input
              type="text"
              value={value[lang] || ""}
              onChange={(e) => onChange(field, lang, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
              placeholder={placeholder || `${label} in ${lang.toUpperCase()}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}



