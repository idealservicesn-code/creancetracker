"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Palette,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { revokeInvitation, removeTeamMember, updateSupervisorPermissions } from "@/lib/actions-org";
import {
  createInvitationForOrg,
  updateMemberRoleAsSuperAdmin,
  updateOrganizationAsSuperAdmin,
} from "@/lib/actions-admin";
import { Client, Invitation, LoanWithBalance, Organization, Profile, SupervisorPermissions, UserRole } from "@/lib/types";
import { DEFAULT_ORG_THEME } from "@/lib/color";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import { cn, formatDate, formatMoney, statusBadgeClasses, statusLabel } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  supervisor: "Superviseur",
};

const SECTIONS: { key: "dashboard" | "clients" | "loans" | "documents"; label: string; editable: boolean }[] = [
  { key: "dashboard", label: "Dashboard", editable: false },
  { key: "clients", label: "Clients & Carte", editable: true },
  { key: "loans", label: "Prêts", editable: true },
  { key: "documents", label: "Documents", editable: true },
];

function PermissionCheckboxes({ defaultPermissions }: { defaultPermissions?: SupervisorPermissions }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SECTIONS.map((section) => (
        <div key={section.key} className="rounded-lg border border-gray-200 p-2.5">
          <p className="mb-1.5 text-xs font-semibold text-gray-700">{section.label}</p>
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              name={`${section.key}_view`}
              defaultChecked={
                defaultPermissions?.[section.key]?.view ??
                (section.key === "dashboard" || section.key === "clients" || section.key === "loans")
              }
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Voir
          </label>
          {section.editable && (
            <label className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                name={`${section.key}_edit`}
                defaultChecked={
                  defaultPermissions?.[section.key]?.edit ??
                  (section.key === "clients" || section.key === "loans")
                }
                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Modifier
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

function InviteForm({ orgId }: { orgId: string }) {
  const [role, setRole] = useState<UserRole>("supervisor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setLink(null);
    const result = await createInvitationForOrg(orgId, formData);
    setLoading(false);
    if (!result.success || !result.token) {
      setError(result.error ?? "Erreur lors de la création de l'invitation.");
      return;
    }
    setLink(`${window.location.origin}/join/${result.token}`);
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus size={18} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900">Ajouter un membre à cette organisation</h2>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid max-w-sm grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="label">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input"
            >
              <option value="supervisor">Superviseur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div>
            <label htmlFor="email" className="label">
              Email (optionnel)
            </label>
            <input id="email" name="email" type="email" className="input" placeholder="membre@entreprise.com" />
          </div>
        </div>

        {role === "supervisor" && (
          <div>
            <p className="label mb-2">Niveaux d&rsquo;accès</p>
            <PermissionCheckboxes />
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Générer le lien d&rsquo;invitation
        </button>
      </form>

      {link && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 ring-1 ring-brand-100">
          <input readOnly value={link} className="flex-1 bg-transparent text-xs text-brand-800 outline-none" />
          <button
            type="button"
            onClick={copyLink}
            className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200 hover:bg-brand-50"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}
    </div>
  );
}

function InvitationsList({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  async function handleRevoke(id: string) {
    setBusyId(id);
    await revokeInvitation(id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Invitations en attente</h2>
      <ul className="divide-y divide-gray-100">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-800">{inv.email || "Lien générique (sans email)"}</p>
              <p className="text-xs text-gray-400">
                {ROLE_LABELS[inv.role]} · Expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === inv.id}
              onClick={() => handleRevoke(inv.id)}
              className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {busyId === inv.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Révoquer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemberRow({ member, orgId }: { member: Profile; orgId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  async function handleSavePermissions(formData: FormData) {
    setSaving(true);
    const permissions: SupervisorPermissions = {
      clients: { view: formData.get("clients_view") === "on", edit: formData.get("clients_edit") === "on" },
      loans: { view: formData.get("loans_view") === "on", edit: formData.get("loans_edit") === "on" },
      documents: {
        view: formData.get("documents_view") === "on",
        edit: formData.get("documents_edit") === "on",
      },
      dashboard: { view: formData.get("dashboard_view") === "on" },
    };
    await updateSupervisorPermissions(member.id, permissions);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleRoleChange(newRole: "admin" | "supervisor") {
    setChangingRole(true);
    await updateMemberRoleAsSuperAdmin(member.id, orgId, newRole);
    setChangingRole(false);
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    await removeTeamMember(member.id);
    router.refresh();
  }

  const isSupervisor = member.role === "supervisor";
  const isSuperAdminRow = member.role === "super_admin";

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">{member.full_name || "Sans nom"}</p>
          <span
            className={cn(
              "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
              member.role === "admin" || member.role === "super_admin"
                ? "bg-brand-50 text-brand-700"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {ROLE_LABELS[member.role]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isSuperAdminRow && (
            <button
              type="button"
              disabled={changingRole}
              onClick={() => handleRoleChange(isSupervisor ? "admin" : "supervisor")}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              {changingRole ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isSupervisor ? (
                "Promouvoir admin"
              ) : (
                "Rétrograder superviseur"
              )}
            </button>
          )}
          {isSupervisor && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              {editing ? "Fermer" : "Modifier les accès"}
            </button>
          )}
          {!isSuperAdminRow && (
            <button
              type="button"
              disabled={removing}
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Retirer
            </button>
          )}
        </div>
      </div>

      {editing && isSupervisor && (
        <form action={handleSavePermissions} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
          <PermissionCheckboxes defaultPermissions={member.permissions} />
          <button type="submit" disabled={saving} className="btn-secondary !py-1.5 text-xs">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Enregistrer
          </button>
        </form>
      )}
    </li>
  );
}

function TeamTab({
  orgId,
  members,
  invitations,
}: {
  orgId: string;
  members: Profile[];
  invitations: Invitation[];
}) {
  return (
    <div className="space-y-6">
      <InviteForm orgId={orgId} />
      <InvitationsList invitations={invitations} />
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Membres de l&rsquo;équipe</h2>
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Aucun membre pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} orgId={orgId} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClientsTab({ clients, currency }: { clients: Client[]; currency: string }) {
  if (clients.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucun client pour cette organisation.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden !p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Téléphone</th>
            <th className="px-4 py-3">Adresse</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Ajouté le</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
              <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{c.address_notes || "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                    c.status
                  )}`}
                >
                  {statusLabel(c.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoansTab({ loans, currency }: { loans: LoanWithBalance[]; currency: string }) {
  if (loans.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucun prêt pour cette organisation.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden !p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Montant total</th>
            <th className="px-4 py-3">Solde restant</th>
            <th className="px-4 py-3">Échéance</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loans.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{l.client_full_name}</td>
              <td className="px-4 py-3 text-gray-600">{formatMoney(l.total_due_amount, currency)}</td>
              <td className="px-4 py-3 text-gray-600">{formatMoney(l.balance_due, currency)}</td>
              <td className="px-4 py-3 text-gray-500">{formatDate(l.due_date)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                    l.status
                  )}`}
                >
                  {statusLabel(l.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ organization }: { organization: Organization }) {
  const router = useRouter();
  const theme = { ...DEFAULT_ORG_THEME, ...organization.theme };
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateOrganizationAsSuperAdmin(organization.id, formData);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form action={handleSave} className="card max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900">Informations de l&rsquo;organisation</h2>
      </div>

      <div>
        <label htmlFor="name" className="label">
          Nom de l&rsquo;organisation
        </label>
        <input id="name" name="name" type="text" required defaultValue={organization.name} className="input max-w-sm" />
      </div>

      <div className="max-w-sm">
        <label htmlFor="currency" className="label">
          Devise
        </label>
        <select id="currency" name="currency" defaultValue={organization.currency || DEFAULT_CURRENCY} className="input">
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-sm">
        <label htmlFor="locale" className="label">
          Langue
        </label>
        <select id="locale" name="locale" defaultValue={organization.locale} className="input">
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      <input type="hidden" name="accent_color" value={theme.accent_color} />
      <input type="hidden" name="bg_color" value={theme.bg_color} />
      <input type="hidden" name="font_family" value={theme.font_family} />
      <input type="hidden" name="font_size" value={theme.font_size} />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Modifications enregistrées.</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Enregistrer
      </button>

      <p className="text-xs text-gray-400">
        L&rsquo;apparence (couleurs, police) reste modifiable par l&rsquo;administrateur de cette organisation
        depuis ses propres paramètres.
      </p>
    </form>
  );
}

type TabKey = "team" | "clients" | "loans" | "settings";

export default function SuperAdminOrgDetail({
  organization,
  members,
  invitations,
  clients,
  loans,
}: {
  organization: Organization;
  currentProfileId: string;
  members: Profile[];
  invitations: Invitation[];
  clients: Client[];
  loans: LoanWithBalance[];
}) {
  const [tab, setTab] = useState<TabKey>("team");
  const currency = organization.currency || DEFAULT_CURRENCY;

  const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
    { key: "team", label: "Équipe", icon: Users },
    { key: "clients", label: "Clients", icon: Users },
    { key: "loans", label: "Prêts", icon: Wallet },
    { key: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div>
      <Link
        href="/super-admin"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} />
        Retour à la console
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-sm text-gray-500">
            {members.length} membre{members.length > 1 ? "s" : ""} · {clients.length} client
            {clients.length > 1 ? "s" : ""} · {loans.length} prêt{loans.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
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
          </button>
        ))}
      </div>

      {tab === "team" && <TeamTab orgId={organization.id} members={members} invitations={invitations} />}
      {tab === "clients" && <ClientsTab clients={clients} currency={currency} />}
      {tab === "loans" && <LoansTab loans={loans} currency={currency} />}
      {tab === "settings" && <SettingsTab organization={organization} />}
    </div>
  );
}
