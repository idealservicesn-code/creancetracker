"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Landmark, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/actions";
import { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/i18n-shared";

interface LoginFormProps {
  dict: ReturnType<typeof getDictionary>;
  locale: Locale;
}

export default function LoginForm({ dict }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = dict.login;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center lg:hidden">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
          <Landmark size={24} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Créances Tracker</h1>
      </div>

      <div className="mb-8 hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900">{t.welcome}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <form
        action={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl shadow-gray-200/60 backdrop-blur-sm"
      >
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
              placeholder="admin@example.com"
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
              autoComplete="current-password"
              className="input !pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

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
        {t.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          {t.signupLink}
        </Link>
      </p>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck size={13} />
        {t.secure}
      </p>
    </div>
  );
}
