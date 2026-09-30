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
  profile: Pick<Profile, "role" | "permissions"> | null,
  section: "clients" | "loans" | "documents" | "dashboard",
  action: "view" | "edit" = "view"
): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "super_admin") return true;
  return Boolean(profile.permissions?.[section]?.[action]);
}
