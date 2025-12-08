"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguagePicker } from "@/components/LanguagePicker";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

const translations = {
  en: {
    brand: "ShopEverywhere",
    title: "Forgot your password?",
    subtitle: "We’ll send a reset link if the email is on file.",
    email: "Email address",
    sending: "Sending link...",
    submit: "Send reset link",
    success: "If an account exists, we’ve emailed you a link to reset your password.",
    genericError: "Something went wrong. Please try again.",
    networkError: "Unable to send reset email. Please try again.",
    back: "Back to login",
  },
  fr: {
    brand: "ShopEverywhere",
    title: "Mot de passe oublié ?",
    subtitle: "Nous enverrons un lien si le courriel est enregistré.",
    email: "Adresse courriel",
    sending: "Envoi du lien...",
    submit: "Envoyer le lien",
    success: "Si un compte existe, nous avons envoyé un lien pour réinitialiser votre mot de passe.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    networkError: "Impossible d'envoyer le courriel. Veuillez réessayer.",
    back: "Retour à la connexion",
  },
  es: {
    brand: "ShopEverywhere",
    title: "¿Olvidaste tu contraseña?",
    subtitle: "Enviaremos un enlace si el correo existe.",
    email: "Correo electrónico",
    sending: "Enviando enlace...",
    submit: "Enviar enlace",
    success: "Si existe una cuenta, te enviamos un enlace para restablecer tu contraseña.",
    genericError: "Algo salió mal. Inténtalo de nuevo.",
    networkError: "No se pudo enviar el correo. Inténtalo de nuevo.",
    back: "Volver al inicio de sesión",
  },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { locale, setLocale } = usePreferredLocale("en");
  const t = (key: keyof typeof translations.en) => translations[locale]?.[key] ?? translations.en[key];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage(t("success"));
        setEmail("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data?.error || t("genericError"));
      }
    } catch {
      setStatus("error");
      setMessage(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">{t("brand")}</p>
            <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <LanguagePicker locale={locale} onChange={setLocale} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          {status !== "idle" && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {loading ? t("sending") : t("submit")}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600">
          <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}





