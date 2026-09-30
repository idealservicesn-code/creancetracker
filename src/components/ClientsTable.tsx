"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Paperclip } from "lucide-react";
import { Client, ClientDocument } from "@/lib/types";
import { statusBadgeClasses, statusLabel } from "@/lib/utils";
import ClientDocuments from "./ClientDocuments";

export default function ClientsTable({
  clients,
  documentsByClient = {},
}: {
  clients: Client[];
  documentsByClient?: Record<string, ClientDocument[]>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (clients.length === 0) {
    return (
      <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
        Aucun client enregistré pour le moment.
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
            <th className="px-4 py-3">Localisation</th>
            <th className="px-4 py-3">Pièces jointes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map((c) => {
            const docs = documentsByClient[c.id] ?? [];
            const isExpanded = expandedId === c.id;
            return (
              <Fragment key={c.id}>
                <tr className="hover:bg-gray-50">
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
                  <td className="px-4 py-3 text-gray-500">
                    {c.latitude !== null && c.longitude !== null ? (
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin size={12} /> {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Paperclip size={12} />
                      {docs.length > 0 ? `${docs.length} document(s)` : "Ajouter"}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <ClientDocuments clientId={c.id} documents={docs} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
