"use server";

// ============================================================================
// Actions réservées au Super Admin : gérer n'importe quelle organisation et
// ses membres, indépendamment de l'organisation propre du super admin (qui
// n'en a pas). Chaque action revérifie isSuperAdmin(profile) côté serveur —
// la RLS (is_super_admin() dans les policies Postgres) est la seconde ligne
// de défense si ce contrôle applicatif était un jour contourné.
// ============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth-shared";
import { ActionResult } from "@/lib/actions";
import { Locale, OrgTheme, UserRole } from "@/lib/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";

const VALID_CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));

function sanitizeCurrency(raw: FormDataEntryValue | null): string {
  const value = String(raw || "").trim().toUpperCase();
  return VALID_CURRENCY_CODES.has(value) ? value : DEFAULT_CURRENCY;
}

async function requireSuperAdmin(): Promise<ActionResult | null> {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) {
    return { success: false, error: "Action réservée au super administrateur." };
  }
  return null;
}

// ----------------------------------------------------------------------------
// Organisation : modification par le super admin, quelle que soit l'organisation
// ----------------------------------------------------------------------------
export async function updateOrganizationAsSuperAdmin(orgId: string, formData: FormData): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const name = String(formData.get("name") || "").trim();
  if (!name) return { success: false, error: "Le nom de l'organisation est obligatoire." };

  const theme: OrgTheme = {
    bg_color: String(formData.get("bg_color") || "#f9fafb"),
    accent_color: String(formData.get("accent_color") || "#2f8f72"),
    font_family: String(formData.get("font_family") || "sans"),
    font_size: (String(formData.get("font_size") || "base") as OrgTheme["font_size"]) || "base",
  };
  const localeRaw = String(formData.get("locale") || "fr");
  const locale: Locale = (["fr", "en", "ar"] as const).includes(localeRaw as Locale)
    ? (localeRaw as Locale)
    : "fr";
  const currency = sanitizeCurrency(formData.get("currency"));

  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, theme, locale, currency })
    .eq("id", orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/super-admin/${orgId}`);
  revalidatePath("/super-admin");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Invitations : le super admin peut inviter un membre pour N'IMPORTE QUELLE
// organisation (contrairement à createInvitation dans actions-org.ts, qui
// cible toujours l'organisation du profil appelant).
// ----------------------------------------------------------------------------
export async function createInvitationForOrg(
  orgId: string,
  formData: FormData
): Promise<ActionResult & { token?: string }> {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const email = String(formData.get("email") || "").trim() || null;
  const role = (String(formData.get("role") || "supervisor") as UserRole) === "admin" ? "admin" : "supervisor";
  const permissions =
    role === "admin"
      ? {}
      : {
          clients: { view: formData.get("clients_view") === "on", edit: formData.get("clients_edit") === "on" },
          loans: { view: formData.get("loans_view") === "on", edit: formData.get("loans_edit") === "on" },
          documents: {
            view: formData.get("documents_view") === "on",
            edit: formData.get("documents_edit") === "on",
          },
          dashboard: { view: formData.get("dashboard_view") === "on" },
        };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({ organization_id: orgId, email, role, permissions })
    .select("token")
    .single();

  if (error || !data) return { success: false, error: error?.message || "Erreur lors de la création de l'invitation." };

  revalidatePath(`/super-admin/${orgId}`);
  return { success: true, token: data.token as string };
}

// ----------------------------------------------------------------------------
// Membres : changer le rôle d'un membre (admin <-> superviseur uniquement —
// jamais vers/depuis super_admin via cette interface, par prudence).
// ----------------------------------------------------------------------------
export async function updateMemberRoleAsSuperAdmin(
  profileId: string,
  orgId: string,
  newRole: "admin" | "supervisor"
): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const supabase = createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();

  if (target?.role === "super_admin") {
    return { success: false, error: "Le rôle super admin ne peut pas être modifié depuis cette console." };
  }

  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/super-admin/${orgId}`);
  return { success: true };
}
