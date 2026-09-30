"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wallet, LogOut, Landmark, UserPlus, Settings, ShieldCheck, Building2 } from "lucide-react";
import { signOut } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { canAccess, isAdminOrAbove, isSuperAdmin } from "@/lib/auth-shared";
import { Organization, Profile } from "@/lib/types";

interface SidebarProps {
  organization: Organization | null;
  profile: Profile | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  supervisor: "Superviseur",
};

export default function Sidebar({ organization, profile }: SidebarProps) {
  const pathname = usePathname();
  const admin = isAdminOrAbove(profile);
  const superAdmin = isSuperAdmin(profile);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" as const },
    { href: "/clients", label: "Clients & Carte", icon: Users, section: "clients" as const },
    { href: "/loans", label: "Gestion des prêts", icon: Wallet, section: "loans" as const },
  ].filter((item) => canAccess(profile, item.section, "view"));

  const logoUrl =
    organization?.logo_storage_path && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-logos/${organization.logo_storage_path}`
      : null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <Link
        href="/"
        className="flex items-center gap-2 border-b border-gray-200 px-5 py-5 transition hover:bg-gray-50"
        title="Retour à l'accueil"
      >
        {logoUrl ? (
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-200">
            <Image src={logoUrl} alt={organization?.name ?? "Logo"} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Landmark size={18} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-gray-900">
            {organization?.name || "Créances Tracker"}
          </p>
          <p className="truncate text-xs text-gray-500">Suivi des recouvrements</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {admin && !superAdmin ? (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Administration
            </div>
            <Link
              href="/team"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/team")
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <UserPlus size={18} />
              Équipe
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/settings")
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Settings size={18} />
              Paramètres
            </Link>
          </>
        ) : null}

        {superAdmin ? (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Super Admin
            </div>
            <Link
              href="/super-admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/super-admin")
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Building2 size={18} />
              Console Super Admin
            </Link>
          </>
        ) : null}
      </nav>

      <div className="border-t border-gray-200 px-3 pt-3">
        <Link
          href="/account"
          className={cn(
            "mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-100",
            pathname.startsWith("/account") ? "bg-brand-50 text-brand-700" : "bg-gray-50"
          )}
          title="Mon compte"
        >
          <ShieldCheck size={14} className="shrink-0 text-brand-600" />
          <span className="truncate">{profile?.full_name || "Mon compte"}</span>
          <span className="ml-auto shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200">
            {profile ? ROLE_LABELS[profile.role] : ""}
          </span>
        </Link>
        <form action={signOut} className="pb-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
