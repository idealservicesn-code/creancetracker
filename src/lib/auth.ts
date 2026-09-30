import { createClient } from "@/lib/supabase/server";
import { Organization, Profile } from "@/lib/types";

export * from "@/lib/auth-shared";

/** Le profil applicatif (rôle, organisation, permissions) de l'utilisateur courant, ou null. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
}

/**
 * Un utilisateur authentifié peut ne pas encore avoir de profil applicatif si son
 * organisation n'a pas pu être créée immédiatement après l'inscription (compte en
 * attente de confirmation par email). On finalise alors automatiquement, à la
 * première connexion, à partir des métadonnées stockées lors de l'inscription
 * (voir lib/actions-org.ts : signUpOrganization / acceptInvitation).
 */
export async function ensureProfileProvisioned(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) return existing as Profile;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : null;

  const pendingOrgName = typeof metadata.pending_org_name === "string" ? metadata.pending_org_name : null;
  if (pendingOrgName) {
    const pendingOrgCurrency =
      typeof metadata.pending_org_currency === "string" ? metadata.pending_org_currency : undefined;
    const { data: org } = await supabase
      .from("organizations")
      .insert({
        name: pendingOrgName,
        created_by: user.id,
        ...(pendingOrgCurrency ? { currency: pendingOrgCurrency } : {}),
      })
      .select()
      .single();
    if (!org) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .insert({ id: user.id, organization_id: org.id, role: "admin", full_name: fullName })
      .select()
      .single();
    return (profile as Profile) ?? null;
  }

  const pendingInviteToken = typeof metadata.pending_invite_token === "string" ? metadata.pending_invite_token : null;
  if (pendingInviteToken) {
    const { data: inviteRows } = await supabase.rpc("get_invitation", { p_token: pendingInviteToken });
    const invitation = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;
    if (!invitation || !invitation.valid) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        organization_id: invitation.organization_id,
        role: invitation.role,
        full_name: fullName,
        permissions: invitation.permissions ?? {},
      })
      .select()
      .single();

    if (profile) await supabase.rpc("accept_invitation", { p_token: pendingInviteToken });
    return (profile as Profile) ?? null;
  }

  return null;
}

/** L'organisation de l'utilisateur courant (branding, thème, langue), ou null. */
export async function getCurrentOrganization(profile?: Profile | null): Promise<Organization | null> {
  const p = profile === undefined ? await getCurrentProfile() : profile;
  if (!p?.organization_id) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", p.organization_id)
    .maybeSingle();
  return (data as Organization) ?? null;
}
