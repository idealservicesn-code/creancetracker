// ============================================================================
// Lecture de données pour la console Super Admin. Ces fonctions traversent
// explicitement TOUTES les organisations — elles ne doivent être appelées que
// depuis des pages/actions qui ont déjà vérifié isSuperAdmin(profile). La RLS
// (is_super_admin() dans les policies Postgres) constitue la seconde ligne de
// défense si jamais cet appel côté application était contourné.
// ============================================================================
import { createClient } from "@/lib/supabase/server";
import { Client, Invitation, LoanWithBalance, Organization, Profile } from "@/lib/types";

export interface OrganizationOverview extends Organization {
  members_count: number;
  admins_count: number;
  clients_count: number;
  loans_count: number;
  outstanding_balance: number;
}

/** Vue d'ensemble de toutes les organisations de la plateforme, avec compteurs. */
export async function getAllOrganizationsOverview(): Promise<OrganizationOverview[]> {
  const supabase = createClient();

  const [{ data: orgs, error: orgsError }, { data: profiles }, { data: clients }, { data: loans }] =
    await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, organization_id, role"),
      supabase.from("clients").select("id, organization_id"),
      supabase.from("v_loans_with_balance").select("organization_id, status, balance_due"),
    ]);

  if (orgsError) throw new Error(orgsError.message);

  return (orgs ?? []).map((org) => {
    const orgProfiles = (profiles ?? []).filter((p) => p.organization_id === org.id);
    const orgClients = (clients ?? []).filter((c) => c.organization_id === org.id);
    const orgLoans = (loans ?? []).filter((l) => l.organization_id === org.id);
    return {
      ...(org as Organization),
      members_count: orgProfiles.length,
      admins_count: orgProfiles.filter((p) => p.role === "admin" || p.role === "super_admin").length,
      clients_count: orgClients.length,
      loans_count: orgLoans.length,
      outstanding_balance: orgLoans
        .filter((l) => l.status !== "paid")
        .reduce((sum, l) => sum + Number(l.balance_due ?? 0), 0),
    };
  });
}

export interface ProfileWithOrg extends Profile {
  organization_name: string | null;
}

/** Tous les membres (admins + superviseurs) de toutes les organisations, avec le nom de leur organisation. */
export async function getAllProfilesWithOrg(): Promise<ProfileWithOrg[]> {
  const supabase = createClient();
  const [{ data: profiles, error }, { data: orgs }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name"),
  ]);
  if (error) throw new Error(error.message);

  const orgNameById = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));
  return (profiles ?? []).map((p) => ({
    ...(p as Profile),
    organization_name: p.organization_id ? orgNameById.get(p.organization_id) ?? null : null,
  }));
}

/** Comptes admin issus de l'inscription libre, en attente de validation par un super admin. */
export async function getPendingAdminAccounts(): Promise<ProfileWithOrg[]> {
  const supabase = createClient();
  const [{ data: profiles, error }, { data: orgs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name"),
  ]);
  if (error) throw new Error(error.message);

  const orgNameById = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));
  return (profiles ?? []).map((p) => ({
    ...(p as Profile),
    organization_name: p.organization_id ? orgNameById.get(p.organization_id) ?? null : null,
  }));
}

export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  const supabase = createClient();
  const { data } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
  return (data as Organization) ?? null;
}

export async function getOrgMembers(orgId: string): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrgPendingInvitations(orgId: string): Promise<Invitation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrgClients(orgId: string): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrgLoans(orgId: string): Promise<LoanWithBalance[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_loans_with_balance")
    .select("*")
    .eq("organization_id", orgId)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
