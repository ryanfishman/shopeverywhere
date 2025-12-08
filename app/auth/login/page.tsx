"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguagePicker } from "@/components/LanguagePicker";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

const translations = {
  en: {
    brand: "ShopEverywhere",
    title: "Welcome back",
    subtitle: "Sign in to continue shopping.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    forgot: "Forgot your password?",
    registerPrompt: "Don't have an account?",
    registerLink: "Register",
    errorNotVerified: "That email doesn't exist yet. Please confirm your inbox to finish signing up.",
    errorInvalid: "Invalid email or password.",
  },
  fr: {
    brand: "ShopEverywhere",
    title: "Bon retour",
    subtitle: "Connectez-vous pour continuer vos achats.",
    email: "Courriel",
    password: "Mot de passe",
    submit: "Se connecter",
    forgot: "Mot de passe oublié ?",
    registerPrompt: "Vous n'avez pas de compte ?",
    registerLink: "Inscription",
    errorNotVerified: "Ce courriel n'existe pas encore. Veuillez confirmer votre boîte de réception.",
    errorInvalid: "Courriel ou mot de passe invalide.",
  },
  es: {
    brand: "ShopEverywhere",
    title: "Bienvenido de nuevo",
    subtitle: "Inicia sesión para seguir comprando.",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Iniciar sesión",
    forgot: "¿Olvidaste tu contraseña?",
    registerPrompt: "¿No tienes una cuenta?",
    registerLink: "Regístrate",
    errorNotVerified: "Ese correo aún no existe. Confirma tu bandeja para finalizar el registro.",
    errorInvalid: "Correo o contraseña inválidos.",
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { locale, setLocale } = usePreferredLocale("en");
  const t = (key: keyof typeof translations.en) => translations[locale]?.[key] ?? translations.en[key];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/");
    } else {
      if (result?.error === "EmailNotVerified") {
        setError(t("errorNotVerified"));
      } else {
        setError(t("errorInvalid"));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">{t("brand")}</p>
            <h2 className="text-3xl font-bold text-gray-900">{t("title")}</h2>
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t("submit")}
          </button>
        </form>
        <div className="text-center">
          <p className="mb-2 text-sm text-gray-600">
            <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t("forgot")}
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            {t("registerPrompt")}{" "}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t("registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



