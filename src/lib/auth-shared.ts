// Fonctions pures (rôles/permissions) qui ne dépendent PAS du client Supabase
// serveur, afin de pouvoir être importées depuis des Client Components (ex:
// Sidebar) sans faire fuiter next/headers dans leur bundle.
import { Profile } from "@/lib/types";

export function isAdminOrAbove(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "admin" || profile?.role === "super_admin";
}

export function isSuperAdmin(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "super_admin";
}

export function canAccess(
  profile: Pick<Profile, "role" | "permissions" | "status"> | null,
  section: "clients" | "loans" | "documents" | "dashboard",
  action: "view" | "edit" = "view"
): boolean {
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role === "admin") {
    // Un admin "pending" (inscription libre non encore validée par le super
    // admin) garde un accès en lecture mais pas d'écriture tant qu'il n'est
    // pas validé — voir isPendingAdmin().
    if (action === "edit" && profile.status === "pending") return false;
    return true;
  }
  return Boolean(profile.permissions?.[section]?.[action]);
}

/** Un admin issu de l'inscription libre, pas encore validé par un super admin. */
export function isPendingAdmin(profile: Pick<Profile, "role" | "status"> | null): boolean {
  return profile?.role === "admin" && profile?.status === "pending";
}

export const PENDING_VALIDATION_MESSAGE =
  "Votre compte est en attente de validation par le super administrateur de la plateforme. Vous pouvez consulter vos données, mais pas encore les modifier.";
