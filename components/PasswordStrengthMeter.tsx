"use client";

import clsx from "clsx";

const meterTranslations = {
  en: {
    heading: "Password strength",
    levels: ["Too weak", "Weak", "Fair", "Good", "Excellent"],
    checks: ["At least 8 characters", "Contains an uppercase letter", "Contains a number", "Contains a symbol"],
  },
  fr: {
    heading: "Solidité du mot de passe",
    levels: ["Très faible", "Faible", "Moyen", "Bon", "Excellent"],
    checks: ["Au moins 8 caractères", "Contient une majuscule", "Contient un chiffre", "Contient un symbole"],
  },
  es: {
    heading: "Fortaleza de la contraseña",
    levels: ["Muy débil", "Débil", "Regular", "Buena", "Excelente"],
    checks: ["Al menos 8 caracteres", "Contiene una mayúscula", "Contiene un número", "Contiene un símbolo"],
  },
};

const getMeterStrings = (locale: string) => meterTranslations[locale as keyof typeof meterTranslations] || meterTranslations.en;

export const evaluatePassword = (password: string, locale = "en") => {
  const strings = getMeterStrings(locale);
  const checks = [
    { label: strings.checks[0], passed: password.length >= 8 },
    { label: strings.checks[1], passed: /[A-Z]/.test(password) },
    { label: strings.checks[2], passed: /\d/.test(password) },
    { label: strings.checks[3], passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.passed).length;

  return {
    score,
    label: strings.levels[score],
    checks,
    heading: strings.heading,
  };
};

type PasswordStrengthMeterProps = {
  password: string;
  locale?: string;
};

export const PasswordStrengthMeter = ({ password, locale = "en" }: PasswordStrengthMeterProps) => {
  const { score, label, checks, heading } = evaluatePassword(password, locale);
  const segments = Array.from({ length: 4 });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{heading}</span>
        <span className={clsx("font-medium", score >= 3 ? "text-green-600" : "text-orange-600")}>{label}</span>
      </div>
      <div className="flex gap-2">
        {segments.map((_, idx) => (
          <div
            key={idx}
            className={clsx("h-2 flex-1 rounded-full transition-colors", idx < score ? "bg-indigo-500" : "bg-gray-200")}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1">
            <span
              className={clsx(
                "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
                check.passed ? "border-green-500 text-green-600" : "border-gray-300 text-gray-400"
              )}
            >
              {check.passed ? "✓" : "•"}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
};





