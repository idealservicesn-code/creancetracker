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
import { createAdminClient } from "@/lib/supabase/admin";
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
// Enrôlement direct : le super admin crée lui-même le compte administrateur
// (email + mot de passe qu'il choisit), actif immédiatement, sans passer par
// un lien d'invitation. Nécessite la clé service_role (voir lib/supabase/admin.ts) :
// c'est la seule façon de créer un compte côté serveur sans jamais toucher à
// la session de navigation du super admin qui effectue l'opération.
// ----------------------------------------------------------------------------
export async function createAdminAccountDirectly(
  orgId: string,
  formData: FormData
): Promise<ActionResult & { email?: string; password?: string }> {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!full_name || !email || !password) {
    return { success: false, error: "Tous les champs sont obligatoires." };
  }
  if (password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      success: false,
      error:
        "La création directe de compte nécessite la clé service_role de Supabase (variable SUPABASE_SERVICE_ROLE_KEY), qui n'est pas configurée sur ce déploiement. Utilisez en attendant le lien d'invitation.",
    };
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Un compte existe déjà avec cet email."
      : createError.message;
    return { success: false, error: message };
  }

  const user = created.user;
  if (!user) return { success: false, error: "Création du compte impossible. Réessayez." };

  const supabase = createClient();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    organization_id: orgId,
    role: "admin" as UserRole,
    full_name,
  });

  if (profileError) {
    // Compte créé côté Auth mais profil impossible à insérer : on retire le
    // compte orphelin plutôt que de laisser un utilisateur fantôme.
    await adminClient.auth.admin.deleteUser(user.id);
    return { success: false, error: profileError.message };
  }

  revalidatePath(`/super-admin/${orgId}`);
  revalidatePath("/super-admin");
  return { success: true, email, password };
}

// ----------------------------------------------------------------------------
// Validation d'un compte admin issu de l'inscription libre (statut 'pending').
// Le super admin confirme (ou corrige) le rôle à cette occasion : rester
// Administrateur de sa propre organisation, ou être rétrogradé Superviseur
// (par exemple si son organisation doit en fait être rattachée à une équipe
// existante — à faire manuellement si besoin). Le compte passe 'active' dans
// tous les cas, ce qui lève la restriction en lecture seule.
// ----------------------------------------------------------------------------
export async function validateAdminAccount(
  profileId: string,
  orgId: string,
  role: "admin" | "supervisor" = "admin"
): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const supabase = createClient();
  const update: { status: "active"; role: UserRole; permissions?: Record<string, unknown> } = {
    status: "active",
    role,
  };
  if (role === "supervisor") {
    // Accès par défaut cohérent avec celui proposé ailleurs pour un nouveau
    // superviseur (voir PermissionCheckboxes) : clients + prêts en voir/modifier,
    // dashboard en lecture, documents laissés fermés par défaut.
    update.permissions = {
      clients: { view: true, edit: true },
      loans: { view: true, edit: true },
      documents: { view: false, edit: false },
      dashboard: { view: true },
    };
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${orgId}`);
  return { success: true };
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
