"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { acceptInvitation } from "@/lib/actions-org";
import { getDictionary } from "@/lib/i18n-shared";

interface JoinFormProps {
  dict: ReturnType<typeof getDictionary>;
  token: string;
  prefilledEmail: string | null;
}

export default function JoinForm({ dict, token, prefilledEmail }: JoinFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const t = dict.join;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await acceptInvitation(token, formData);
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
      <div className="rounded-2xl border border-gray-100 bg-white/90 p-6 text-center shadow-xl shadow-gray-200/60">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Mail size={22} />
        </div>
        <p className="text-sm text-gray-600">
          Un email de confirmation vient de vous être envoyé. Cliquez sur le lien reçu puis
          connectez-vous pour rejoindre l&rsquo;équipe.
        </p>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl shadow-gray-200/60"
    >
      <div>
        <label htmlFor="full_name" className="label">
          {t.fullName}
        </label>
        <div className="relative">
          <User size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input id="full_name" name="full_name" type="text" required className="input !pl-9" />
        </div>
      </div>

      {!prefilledEmail ? (
        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input id="email" name="email" type="email" required className="input !pl-9" />
          </div>
        </div>
      ) : (
        <div>
          <label className="label">Adresse email</label>
          <p className="input flex items-center !pl-3 bg-gray-50 text-gray-500">{prefilledEmail}</p>
        </div>
      )}

      <div>
        <label htmlFor="password" className="label">
          {t.password}
        </label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input !pl-9"
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full !py-2.5 text-[15px] shadow-lg shadow-brand-600/20"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {t.submit}
      </button>
    </form>
  );
}
