"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ImagePlus, Loader2, Lock, Mail, Sparkles, User, Coins } from "lucide-react";
import { signUpOrganization } from "@/lib/actions-org";
import { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/i18n-shared";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";

interface SignupFormProps {
  dict: ReturnType<typeof getDictionary>;
  locale: Locale;
}

export default function SignupForm({ dict }: SignupFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const t = dict.signup;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUpOrganization(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }
    if (result.pendingConfirmation) {
      setPendingConfirmation(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (pendingConfirmation) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white/90 p-6 text-center shadow-xl shadow-gray-200/60">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Mail size={22} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Vérifiez vos emails</h2>
        <p className="mt-2 text-sm text-gray-500">
          Un email de confirmation vient de vous être envoyé. Cliquez sur le lien reçu puis
          connectez-vous : votre organisation sera créée automatiquement.
        </p>
        <Link href="/login" className="btn-primary mt-5 inline-flex !py-2.5">
          {dict.login.submit}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <form
        action={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl shadow-gray-200/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-brand-400 hover:text-brand-600"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <ImagePlus size={20} />
            )}
          </button>
          <div className="text-xs text-gray-500">
            {t.logo}
            <input
              ref={fileInputRef}
              type="file"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="mt-1 block text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand-700"
            />
          </div>
        </div>

        <div>
          <label htmlFor="org_name" className="label">
            {t.orgName}
          </label>
          <div className="relative">
            <Building2
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              id="org_name"
              name="org_name"
              type="text"
              required
              className="input !pl-9"
              placeholder={t.orgNamePlaceholder}
            />
          </div>
        </div>

        <div>
          <label htmlFor="full_name" className="label">
            {t.fullName}
          </label>
          <div className="relative">
            <User
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="input !pl-9"
              placeholder={t.fullNamePlaceholder}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            {t.email}
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input !pl-9"
              placeholder="vous@entreprise.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">
            {t.password}
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input !pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="currency" className="label">
            Devise
          </label>
          <div className="relative">
            <Coins
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <select
              id="currency"
              name="currency"
              required
              defaultValue={DEFAULT_CURRENCY}
              className="input !pl-9"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Utilisée pour l&apos;affichage de tous les montants dans votre organisation. Modifiable plus tard dans les paramètres.
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-2.5 text-[15px] shadow-lg shadow-brand-600/20 transition hover:shadow-brand-600/30"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          {t.loginLink}
        </Link>
      </p>

      {/* Guide interactif : conseils contextuels affichés pendant l'inscription */}
      <div className="mt-5 rounded-2xl bg-brand-50/70 p-4 ring-1 ring-brand-100">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-800">
          <Sparkles size={14} />
          {t.tipsTitle}
        </div>
        <ul className="space-y-1.5">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-xs leading-relaxed text-brand-900/70">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
