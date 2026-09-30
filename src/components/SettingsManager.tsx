"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Palette } from "lucide-react";
import { updateOrganizationTheme, uploadOrganizationLogo } from "@/lib/actions-org";
import { DEFAULT_ORG_THEME } from "@/lib/color";
import { Organization } from "@/lib/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";

const FONT_OPTIONS = [
  { value: "sans", label: "Sans-serif (par défaut)" },
  { value: "rounded", label: "Arrondie (Poppins)" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const SIZE_OPTIONS = [
  { value: "sm", label: "Compacte" },
  { value: "base", label: "Normale" },
  { value: "lg", label: "Grande" },
];

const LOCALE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

export default function SettingsManager({ organization }: { organization: Organization }) {
  const router = useRouter();
  const theme = { ...DEFAULT_ORG_THEME, ...organization.theme };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState(theme.accent_color);
  const [bg, setBg] = useState(theme.bg_color);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const logoUrl =
    organization.logo_storage_path && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-logos/${organization.logo_storage_path}`
      : null;

  async function handleSave(formData: FormData) {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateOrganizationTheme(formData);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLogoError(null);
    const formData = new FormData();
    formData.set("logo", file);
    const result = await uploadOrganizationLogo(formData);
    setUploading(false);
    if (!result.success) {
      setLogoError(result.error ?? "Erreur lors du téléversement.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Logo</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-brand-400 hover:text-brand-600"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : logoUrl ? (
              <Image src={logoUrl} alt={organization.name} fill className="object-contain" unoptimized />
            ) : (
              <ImagePlus size={22} />
            )}
          </button>
          <div className="text-xs text-gray-500">
            <p>PNG, JPG ou SVG. Affiché dans le menu et sur la page de connexion.</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 font-medium text-brand-700 hover:underline"
            >
              Changer le logo
            </button>
            {logoError && <p className="mt-1 text-red-600">{logoError}</p>}
          </div>
        </div>
      </div>

      <form action={handleSave} className="card space-y-5">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Apparence & informations</h2>
        </div>

        <div>
          <label htmlFor="name" className="label">
            Nom de l&rsquo;organisation
          </label>
          <input id="name" name="name" type="text" required defaultValue={organization.name} className="input max-w-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label htmlFor="accent_color" className="label">
              Couleur d&rsquo;accent
            </label>
            <div className="flex items-center gap-2">
              <input
                id="accent_color"
                name="accent_color"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1"
              />
              <span className="text-xs text-gray-500">{accent}</span>
            </div>
          </div>
          <div>
            <label htmlFor="bg_color" className="label">
              Couleur de fond
            </label>
            <div className="flex items-center gap-2">
              <input
                id="bg_color"
                name="bg_color"
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1"
              />
              <span className="text-xs text-gray-500">{bg}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label htmlFor="font_family" className="label">
              Police
            </label>
            <select id="font_family" name="font_family" defaultValue={theme.font_family} className="input">
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="font_size" className="label">
              Taille du texte
            </label>
            <select id="font_size" name="font_size" defaultValue={theme.font_size} className="input">
              {SIZE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-w-sm">
          <label htmlFor="locale" className="label">
            Langue par défaut de l&rsquo;organisation
          </label>
          <select id="locale" name="locale" defaultValue={organization.locale} className="input">
            {LOCALE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Utilisée comme langue par défaut pour les futures communications de votre organisation.
          </p>
        </div>

        <div className="max-w-sm">
          <label htmlFor="currency" className="label">
            Devise de l&rsquo;organisation
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={organization.currency || DEFAULT_CURRENCY}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Utilisée pour l&rsquo;affichage de tous les montants (prêts, paiements, tableau de bord).
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Modifications enregistrées.</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Enregistrer
        </button>
      </form>
    </div>
  );
}
