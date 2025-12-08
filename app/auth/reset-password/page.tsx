"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { LanguagePicker } from "@/components/LanguagePicker";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

const translations = {
  en: {
    brand: "ShopEverywhere",
    title: "Reset your password",
    subtitle: "Enter the code from your email to confirm this request.",
    code: "Security code",
    token: "Reset token",
    password: "New password",
    confirm: "Confirm new password",
    mismatch: "Passwords do not match.",
    success: "Password updated! You can now sign in with your new password.",
    errorGeneric: "Reset failed. Please request a new link.",
    errorNetwork: "Unable to reset password. Please try again.",
    submit: "Update password",
    submitting: "Updating password...",
    back: "Return to login",
  },
  fr: {
    brand: "ShopEverywhere",
    title: "Réinitialisez votre mot de passe",
    subtitle: "Saisissez le code reçu par courriel pour confirmer la demande.",
    code: "Code de sécurité",
    token: "Jeton de réinitialisation",
    password: "Nouveau mot de passe",
    confirm: "Confirmez le mot de passe",
    mismatch: "Les mots de passe ne correspondent pas.",
    success: "Mot de passe mis à jour ! Vous pouvez maintenant vous connecter.",
    errorGeneric: "Échec de la réinitialisation. Demandez un nouveau lien.",
    errorNetwork: "Impossible de réinitialiser le mot de passe. Veuillez réessayer.",
    submit: "Mettre à jour le mot de passe",
    submitting: "Mise à jour...",
    back: "Retour à la connexion",
  },
  es: {
    brand: "ShopEverywhere",
    title: "Restablece tu contraseña",
    subtitle: "Ingresa el código del correo para confirmar esta solicitud.",
    code: "Código de seguridad",
    token: "Token de restablecimiento",
    password: "Nueva contraseña",
    confirm: "Confirmar nueva contraseña",
    mismatch: "Las contraseñas no coinciden.",
    success: "¡Contraseña actualizada! Ahora puedes iniciar sesión.",
    errorGeneric: "El restablecimiento falló. Solicita un nuevo enlace.",
    errorNetwork: "No se pudo restablecer la contraseña. Inténtalo de nuevo.",
    submit: "Actualizar contraseña",
    submitting: "Actualizando...",
    back: "Volver al inicio de sesión",
  },
};

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const initialToken = params.get("token") || "";
  const initialCode = params.get("code") || "";

  const [token, setToken] = useState(initialToken);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [loading, setLoading] = useState(false);
  const { locale, setLocale } = usePreferredLocale("en");
  const t = (key: keyof typeof translations.en) => translations[locale]?.[key] ?? translations.en[key];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "idle" });

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: t("mismatch") });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code, password }),
      });

      if (res.ok) {
        setStatus({ type: "success", message: t("success") });
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        const data = await res.json();
        setStatus({ type: "error", message: data?.error || t("errorGeneric") });
      }
    } catch {
      setStatus({ type: "error", message: t("errorNetwork") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-xl">
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
            <label className="block text-sm font-medium text-gray-700">{t("code")}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("token")}</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
            <div className="mt-3">
              <PasswordStrengthMeter password={password} locale={locale} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("confirm")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>
          {status.type !== "idle" && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {loading ? t("submitting") : t("submit")}
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





