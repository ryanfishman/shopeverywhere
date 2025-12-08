"use client";

import { useEffect, useState, useCallback } from "react";
import { LANGUAGES, LanguageCode } from "@/lib/i18n";

const LOCALE_CHANGE_EVENT = "locale-change";

export const usePreferredLocale = (fallback: LanguageCode = "en") => {
  const [locale, setLocaleState] = useState<LanguageCode>(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Read initial value
    const stored = localStorage.getItem("locale") as LanguageCode | null;
    if (stored && LANGUAGES.includes(stored)) {
      setLocaleState(stored);
    }

    // Listen for storage events (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "locale" && e.newValue) {
        const newLocale = e.newValue as LanguageCode;
        if (LANGUAGES.includes(newLocale)) {
          setLocaleState(newLocale);
        }
      }
    };

    // Listen for custom locale change events (same-tab sync)
    const handleLocaleChange = (e: CustomEvent<LanguageCode>) => {
      if (LANGUAGES.includes(e.detail)) {
        setLocaleState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);
    };
  }, []);

  const updateLocale = useCallback((value: string) => {
    const next = (LANGUAGES.includes(value as LanguageCode) ? value : fallback) as LanguageCode;
    setLocaleState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", next);
      // Dispatch custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: next }));
    }
  }, [fallback]);

  return { locale, setLocale: updateLocale };
};
