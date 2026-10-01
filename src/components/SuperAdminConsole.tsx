"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronRight, Loader2, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { validateAdminAccount } from "@/lib/actions-admin";
import { OrganizationOverview, ProfileWithOrg } from "@/lib/data-admin";
import { formatDate, formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  supervisor: "Superviseur",
};

type TabKey = "organizations" | "members" | "pending";

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

function PendingRow({ member }: { member: ProfileWithOrg }) {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "supervisor">("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    if (!member.organization_id) return;
    setBusy(true);
    setError(null);
    const result = await validateAdminAccount(member.id, member.organization_id, role);
    setBusy(false);
    if (!result.success) {
      setError(result.error ?? "Erreur lors de la validation.");
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{member.full_name || "Sans nom"}</p>
        <p className="text-xs text-gray-400">
          {member.organization_name || "—"} · Inscrit le {formatDate(member.created_at)}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "supervisor")}
          className="input !h-9 !py-0 text-xs"
        >
          <option value="admin">Administrateur</option>
          <option value="supervisor">Superviseur</option>
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={handleValidate}
          className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Valider
        </button>
      </div>
    </li>
  );
}

function PendingTab({ pending }: { pending: ProfileWithOrg[] }) {
  if (pending.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucun compte en attente de validation.
      </div>
    );
  }
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
        <ShieldAlert size={14} className="shrink-0" />
        Ces comptes se sont inscrits eux-mêmes via la page d&rsquo;inscription libre (nouvelle
        organisation). Ils ont un accès en lecture seule tant qu&rsquo;ils ne sont pas validés ici.
      </div>
      <ul className="divide-y divide-gray-100">
        {pending.map((member) => (
          <PendingRow key={member.id} member={member} />
        ))}
      </ul>
    </div>
  );
}

export default function SuperAdminConsole({
  organizations,
  members,
  pending,
}: {
  organizations: OrganizationOverview[];
  members: ProfileWithOrg[];
  pending: ProfileWithOrg[];
}) {
  const [tab, setTab] = useState<TabKey>(pending.length > 0 ? "pending" : "organizations");

  const tabs: { key: TabKey; label: string; icon: typeof Building2; count: number }[] = [
    { key: "pending", label: "Validation", icon: ShieldAlert, count: pending.length },
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

      {tab === "pending" ? (
        <PendingTab pending={pending} />
      ) : tab === "organizations" ? (
        <OrganizationsTab organizations={organizations} />
      ) : (
        <MembersTab members={members} />
      )}
    </div>
  );
}
