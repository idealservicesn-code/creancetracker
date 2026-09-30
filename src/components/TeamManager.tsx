"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  createInvitation,
  removeTeamMember,
  revokeInvitation,
  updateSupervisorPermissions,
} from "@/lib/actions-org";
import { Invitation, Profile, SupervisorPermissions } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function PermissionCheckboxes({
  namePrefix,
  defaultPermissions,
}: {
  namePrefix?: string;
  defaultPermissions?: SupervisorPermissions;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SECTIONS.map((section) => (
        <div key={section.key} className="rounded-lg border border-gray-200 p-2.5">
          <p className="mb-1.5 text-xs font-semibold text-gray-700">{section.label}</p>
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              name={`${section.key}_view`}
              defaultChecked={defaultPermissions?.[section.key]?.view ?? section.key === "dashboard"}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Voir
          </label>
          {section.editable && (
            <label className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                name={`${section.key}_edit`}
                defaultChecked={defaultPermissions?.[section.key]?.edit ?? false}
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

function InviteForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setLink(null);
    const result = await createInvitation(formData);
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
        <h2 className="text-sm font-semibold text-gray-900">Inviter un superviseur</h2>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="max-w-sm">
          <label htmlFor="email" className="label">
            Email (optionnel)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="superviseur@entreprise.com"
          />
          <p className="mt-1 text-xs text-gray-400">
            Laissez vide pour générer un lien à partager manuellement (ex: via WhatsApp).
          </p>
        </div>

        <div>
          <p className="label mb-2">Niveaux d&rsquo;accès</p>
          <PermissionCheckboxes />
        </div>

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

  async function handleRevoke(id: string) {
    setBusyId(id);
    await revokeInvitation(id);
    setBusyId(null);
    router.refresh();
  }

  if (invitations.length === 0) return null;

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Invitations en attente</h2>
      <ul className="divide-y divide-gray-100">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-800">{inv.email || "Lien générique (sans email)"}</p>
              <p className="text-xs text-gray-400">
                Expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
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

function MemberRow({ member, isSelf }: { member: Profile; isSelf: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleSave(formData: FormData) {
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

  async function handleRemove() {
    setRemoving(true);
    await removeTeamMember(member.id);
    router.refresh();
  }

  const isSupervisor = member.role === "supervisor";

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">
            {member.full_name || "Sans nom"} {isSelf && <span className="text-gray-400">(vous)</span>}
          </p>
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
          {isSupervisor && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              {editing ? "Fermer" : "Modifier les accès"}
            </button>
          )}
          {!isSelf && (
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
        <form action={handleSave} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
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

export default function TeamManager({
  currentProfileId,
  initialMembers,
  initialInvitations,
}: {
  currentProfileId: string;
  initialMembers: Profile[];
  initialInvitations: Invitation[];
}) {
  return (
    <div className="space-y-6">
      <InviteForm />
      <InvitationsList invitations={initialInvitations} />
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Membres de l&rsquo;équipe</h2>
        <ul className="divide-y divide-gray-100">
          {initialMembers.map((member) => (
            <MemberRow key={member.id} member={member} isSelf={member.id === currentProfileId} />
          ))}
        </ul>
      </div>
    </div>
  );
}
