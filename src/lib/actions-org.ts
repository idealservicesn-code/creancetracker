"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getCurrentProfile, isAdminOrAbove } from "@/lib/auth";
import { ActionResult } from "@/lib/actions";
import { Locale, OrgTheme, SupervisorPermissions, UserRole } from "@/lib/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";

const VALID_CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));

function sanitizeCurrency(raw: FormDataEntryValue | null): string {
  const value = String(raw || "").trim().toUpperCase();
  return VALID_CURRENCY_CODES.has(value) ? value : DEFAULT_CURRENCY;
}

const LOGO_BUCKET = "org-logos";

function mapAuthError(message: string): string {
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("Password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (message.includes("Unable to validate email") || message.includes("invalid")) {
    return "Adresse email invalide.";
  }
  if (message.toLowerCase().includes("rate limit")) {
    return "Trop de tentatives d'inscription en peu de temps sur ce projet. Réessayez dans quelques minutes, ou contactez l'administrateur du système si le problème persiste.";
  }
  return message;
}

// ----------------------------------------------------------------------------
// Inscription libre : création de compte + organisation (l'utilisateur devient
// automatiquement "admin" de sa propre organisation).
// ----------------------------------------------------------------------------
export interface SignUpResult extends ActionResult {
  pendingConfirmation?: boolean;
}

export async function signUpOrganization(formData: FormData): Promise<SignUpResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const orgName = String(formData.get("org_name") || "").trim();
  const currency = sanitizeCurrency(formData.get("currency"));
  const logo = formData.get("logo") as File | null;

  if (!email || !password || !fullName || !orgName) {
    return { success: false, error: "Tous les champs sont obligatoires." };
  }
  if (password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const supabase = createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        // Conservé dans les métadonnées utilisateur pour pouvoir finaliser la
        // création de l'organisation à la première connexion si la confirmation
        // par email est activée sur le projet (pas de session immédiate ici).
        pending_org_name: orgName,
        pending_org_currency: currency,
      },
    },
  });

  if (signUpError) {
    return { success: false, error: mapAuthError(signUpError.message) };
  }

  const user = signUpData.user;
  if (!user) {
    return { success: false, error: "Inscription impossible. Réessayez." };
  }

  if (!signUpData.session) {
    // Confirmation par email requise : l'organisation sera créée automatiquement
    // à la première connexion (voir ensureProfileProvisioned dans lib/auth.ts).
    return { success: true, pendingConfirmation: true };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, created_by: user.id, currency })
    .select()
    .single();

  if (orgError || !org) {
    return { success: false, error: orgError?.message || "Erreur lors de la création de l'organisation." };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    organization_id: org.id,
    role: "admin" as UserRole,
    full_name: fullName,
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  if (logo && logo.size > 0) {
    const safeName = logo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${org.id}/logo_${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(storagePath, logo, { upsert: false });
    if (!uploadError) {
      await supabase.from("organizations").update({ logo_storage_path: storagePath }).eq("id", org.id);
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Invitations (ajout de superviseurs par un admin)
// ----------------------------------------------------------------------------
export async function createInvitation(formData: FormData): Promise<ActionResult & { token?: string }> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile) || !profile?.organization_id) {
    return { success: false, error: "Action réservée aux administrateurs." };
  }

  const email = String(formData.get("email") || "").trim() || null;
  const permissions: SupervisorPermissions = {
    clients: { view: formData.get("clients_view") === "on", edit: formData.get("clients_edit") === "on" },
    loans: { view: formData.get("loans_view") === "on", edit: formData.get("loans_edit") === "on" },
    documents: { view: formData.get("documents_view") === "on", edit: formData.get("documents_edit") === "on" },
    dashboard: { view: formData.get("dashboard_view") === "on" },
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      organization_id: profile.organization_id,
      email,
      role: "supervisor" as UserRole,
      permissions,
    })
    .select("token")
    .single();

  if (error || !data) return { success: false, error: error?.message || "Erreur lors de la création de l'invitation." };

  revalidatePath("/team");
  return { success: true, token: data.token as string };
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile)) return { success: false, error: "Action réservée aux administrateurs." };

  const supabase = createClient();
  const { error } = await supabase.from("invitations").delete().eq("id", invitationId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/team");
  return { success: true };
}

export async function updateSupervisorPermissions(
  profileId: string,
  permissions: SupervisorPermissions
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile)) return { success: false, error: "Action réservée aux administrateurs." };

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ permissions }).eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/team");
  return { success: true };
}

export async function removeTeamMember(profileId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile)) return { success: false, error: "Action réservée aux administrateurs." };
  if (profile?.id === profileId) return { success: false, error: "Vous ne pouvez pas vous retirer vous-même." };

  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/team");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Acceptation d'une invitation (page publique /join/[token])
// ----------------------------------------------------------------------------
export async function acceptInvitation(token: string, formData: FormData): Promise<SignUpResult> {
  const fullName = String(formData.get("full_name") || "").trim();
  const password = String(formData.get("password") || "");
  const emailInput = String(formData.get("email") || "").trim();

  if (!fullName || !password) {
    return { success: false, error: "Tous les champs sont obligatoires." };
  }

  const supabase = createClient();

  const { data: invite, error: inviteError } = await supabase.rpc("get_invitation", { p_token: token });
  const invitation = Array.isArray(invite) ? invite[0] : invite;

  if (inviteError || !invitation || !invitation.valid) {
    return { success: false, error: "Ce lien d'invitation n'est plus valide." };
  }

  const email = invitation.email || emailInput;
  if (!email) {
    return { success: false, error: "Adresse email requise." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        pending_invite_token: token,
      },
    },
  });

  if (signUpError) return { success: false, error: mapAuthError(signUpError.message) };

  const user = signUpData.user;
  if (!user) return { success: false, error: "Inscription impossible. Réessayez." };

  if (!signUpData.session) {
    return { success: true, pendingConfirmation: true };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    organization_id: invitation.organization_id,
    role: invitation.role as UserRole,
    full_name: fullName,
    permissions: invitation.permissions ?? {},
  });

  if (profileError) return { success: false, error: profileError.message };

  await supabase.rpc("accept_invitation", { p_token: token });

  revalidatePath("/", "layout");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Personnalisation de l'organisation (couleurs, police, taille, logo, nom)
// ----------------------------------------------------------------------------
export async function updateOrganizationTheme(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile) || !profile?.organization_id) {
    return { success: false, error: "Action réservée aux administrateurs." };
  }

  const name = String(formData.get("name") || "").trim();
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

  if (!name) return { success: false, error: "Le nom de l'organisation est obligatoire." };

  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, theme, locale, currency })
    .eq("id", profile.organization_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadOrganizationLogo(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile) || !profile?.organization_id) {
    return { success: false, error: "Action réservée aux administrateurs." };
  }

  const logo = formData.get("logo") as File | null;
  if (!logo || logo.size === 0) return { success: false, error: "Veuillez sélectionner une image." };

  const supabase = createClient();
  const safeName = logo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${profile.organization_id}/logo_${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(storagePath, logo, {
    upsert: false,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const org = await getCurrentOrganization(profile);
  const previousPath = org?.logo_storage_path;

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_storage_path: storagePath })
    .eq("id", profile.organization_id);

  if (updateError) return { success: false, error: updateError.message };

  if (previousPath) {
    await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}
