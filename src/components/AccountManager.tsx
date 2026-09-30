"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail, ShieldCheck, User } from "lucide-react";
import { updateOwnProfile, changeOwnPassword } from "@/lib/actions-account";
import { Profile } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  supervisor: "Superviseur",
};

export default function AccountManager({
  profile,
  email,
  organizationName,
}: {
  profile: Profile;
  email: string;
  organizationName: string | null;
}) {
  const router = useRouter();

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSave(formData: FormData) {
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);
    const result = await updateOwnProfile(formData);
    setSavingProfile(false);
    if (!result.success) {
      setProfileError(result.error ?? "Une erreur est survenue.");
      return;
    }
    setProfileSaved(true);
    router.refresh();
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handlePasswordSave(formData: FormData) {
    setSavingPassword(true);
    setPasswordSaved(false);
    setPasswordError(null);
    const result = await changeOwnPassword(formData);
    setSavingPassword(false);
    if (!result.success) {
      setPasswordError(result.error ?? "Une erreur est survenue.");
      return;
    }
    setPasswordSaved(true);
    passwordFormRef.current?.reset();
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Informations du compte</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Mail size={14} className="text-gray-400" />
            {email}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-brand-600" />
            {ROLE_LABELS[profile.role] ?? profile.role}
          </span>
          {organizationName && <span className="text-gray-400">·{" "}{organizationName}</span>}
        </div>

        <form action={handleProfileSave} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="label">
              Nom complet
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={profile.full_name ?? ""}
              className="input max-w-sm"
            />
          </div>

          {profileError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p>
          )}
          {profileSaved && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              Modifications enregistrées.
            </p>
          )}

          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile && <Loader2 size={16} className="animate-spin" />}
            Enregistrer
          </button>
        </form>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Changer le mot de passe</h2>
        </div>

        <form ref={passwordFormRef} action={handlePasswordSave} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="label">
              Mot de passe actuel
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
              className="input max-w-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-sm">
            <div>
              <label htmlFor="new_password" className="label">
                Nouveau mot de passe
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className="label">
                Confirmer
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
              />
            </div>
          </div>

          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>
          )}
          {passwordSaved && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              Mot de passe mis à jour.
            </p>
          )}

          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword && <Loader2 size={16} className="animate-spin" />}
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
