"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, ShieldCheck, Users } from "lucide-react";
import { OrganizationOverview, ProfileWithOrg } from "@/lib/data-admin";
import { formatDate, formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  supervisor: "Superviseur",
};

type TabKey = "organizations" | "members";

function OrganizationsTab({ organizations }: { organizations: OrganizationOverview[] }) {
  if (organizations.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucune organisation pour le moment.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden !p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Organisation</th>
            <th className="px-4 py-3">Devise</th>
            <th className="px-4 py-3">Membres</th>
            <th className="px-4 py-3">Clients</th>
            <th className="px-4 py-3">Prêts</th>
            <th className="px-4 py-3">Encours total</th>
            <th className="px-4 py-3">Créée le</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{org.name}</td>
              <td className="px-4 py-3 text-gray-600">{org.currency}</td>
              <td className="px-4 py-3 text-gray-600">
                {org.members_count} ({org.admins_count} admin{org.admins_count > 1 ? "s" : ""})
              </td>
              <td className="px-4 py-3 text-gray-600">{org.clients_count}</td>
              <td className="px-4 py-3 text-gray-600">{org.loans_count}</td>
              <td className="px-4 py-3 text-gray-600">{formatMoney(org.outstanding_balance, org.currency)}</td>
              <td className="px-4 py-3 text-gray-500">{formatDate(org.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/super-admin/${org.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  Gérer <ChevronRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersTab({ members }: { members: ProfileWithOrg[] }) {
  if (members.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucun membre pour le moment.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden !p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Organisation</th>
            <th className="px-4 py-3">Depuis le</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{m.full_name || "Sans nom"}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    m.role === "admin" || m.role === "super_admin"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {ROLE_LABELS[m.role]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{m.organization_name || "—"}</td>
              <td className="px-4 py-3 text-gray-500">{formatDate(m.created_at)}</td>
              <td className="px-4 py-3 text-right">
                {m.organization_id && (
                  <Link
                    href={`/super-admin/${m.organization_id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Voir l&rsquo;organisation <ChevronRight size={13} />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminConsole({
  organizations,
  members,
}: {
  organizations: OrganizationOverview[];
  members: ProfileWithOrg[];
}) {
  const [tab, setTab] = useState<TabKey>("organizations");

  const tabs: { key: TabKey; label: string; icon: typeof Building2; count: number }[] = [
    { key: "organizations", label: "Organisations", icon: Building2, count: organizations.length },
    { key: "members", label: "Tous les membres", icon: Users, count: members.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon size={15} />
            {label}
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
        <ShieldCheck size={14} className="shrink-0" />
        Vue réservée au super administrateur. Les administrateurs d&rsquo;organisation n&rsquo;ont pas accès à cette console.
      </div>

      {tab === "organizations" ? (
        <OrganizationsTab organizations={organizations} />
      ) : (
        <MembersTab members={members} />
      )}
    </div>
  );
}
