"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { LanguagePicker } from "@/components/LanguagePicker";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

const translations = {
  en: {
    brand: "ShopEverywhere",
    title: "Create your account",
    subtitle: "Sign up to start shopping everywhere.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    submit: "Create account",
    submitting: "Creating account...",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    mismatch: "Passwords do not match.",
    success: "Account created! Check your inbox to confirm your email before signing in.",
    genericError: "Registration failed. Please try again.",
    unexpected: "Unexpected error. Please try again.",
    successTitle: "Account created",
    successCta: "Go to login",
  },
  fr: {
    brand: "ShopEverywhere",
    title: "Créez votre compte",
    subtitle: "Inscrivez-vous pour commencer vos achats partout.",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Courriel",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    submit: "Créer un compte",
    submitting: "Création du compte...",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    mismatch: "Les mots de passe ne correspondent pas.",
    success: "Compte créé ! Vérifiez vos courriels avant de vous connecter.",
    genericError: "Échec de l'inscription. Veuillez réessayer.",
    unexpected: "Erreur inattendue. Veuillez réessayer.",
    successTitle: "Compte créé",
    successCta: "Aller à la connexion",
  },
  es: {
    brand: "ShopEverywhere",
    title: "Crea tu cuenta",
    subtitle: "Regístrate para comenzar a comprar en todas partes.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    submit: "Crear cuenta",
    submitting: "Creando cuenta...",
    haveAccount: "¿Ya tienes una cuenta?",
    signIn: "Iniciar sesión",
    mismatch: "Las contraseñas no coinciden.",
    success: "¡Cuenta creada! Revisa tu correo antes de iniciar sesión.",
    genericError: "El registro falló. Inténtalo de nuevo.",
    unexpected: "Error inesperado. Inténtalo de nuevo.",
    successTitle: "Cuenta creada",
    successCta: "Ir al inicio de sesión",
  },
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cartId, setCartId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { locale, setLocale } = usePreferredLocale("en");

  const t = (key: keyof typeof translations.en) => translations[locale]?.[key] ?? translations.en[key];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCartId(localStorage.getItem("se_cart_id"));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "idle" });

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: t("mismatch") });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, cartId }),
      });

      if (res.ok) {
        setStatus({
          type: "success",
          message: t("success"),
        });
        setCompleted(true);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setStatus({ type: "error", message: data?.error || t("genericError") });
      }
    } catch {
      setStatus({ type: "error", message: t("unexpected") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">{t("brand")}</p>
            <h2 className="text-3xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <LanguagePicker locale={locale} onChange={setLocale} />
        </div>
        {!completed ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("firstName")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("lastName")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
              <PasswordStrengthMeter password={password} locale={locale} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            {status.type === "error" && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.message}</div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </form>
        ) : (
          <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800">{t("successTitle")}</h3>
            <p className="text-sm text-green-700">{t("success")}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              {t("successCta")}
            </Link>
          </div>
        )}
        {!completed && (
          <div className="text-center text-sm text-gray-600">
            {t("haveAccount")}{" "}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              {t("signIn")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}



