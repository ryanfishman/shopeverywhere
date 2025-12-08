"use client";

import { LANGUAGES } from "@/lib/i18n";
import { t } from "@/translations/translations";

interface ZoneTranslationInputsProps {
  translations: Record<string, string>;
  onTranslationChange: (translations: Record<string, string>) => void;
  locale: string;
}

export const ZoneTranslationInputs = ({
  translations,
  onTranslationChange,
  locale,
}: ZoneTranslationInputsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{t(locale, "zoneNameTranslations")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <div key={lang}>
            <label className="text-xs uppercase text-gray-500">{lang}</label>
            <input
              type="text"
              value={translations[lang] || ""}
              onChange={(e) =>
                onTranslationChange({ ...translations, [lang]: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={`${t(locale, "name")} (${lang.toUpperCase()})`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

