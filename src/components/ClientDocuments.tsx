"use client";

import { useState, useTransition } from "react";
import { FileText, IdCard, Loader2, Trash2, Upload } from "lucide-react";
import {
  deleteClientDocument,
  getSignedDocumentUrlAction,
  uploadClientDocument,
} from "@/lib/actions";
import { ClientDocument, DocumentType } from "@/lib/types";

export default function ClientDocuments({
  clientId,
  documents,
}: {
  clientId: string;
  documents: ClientDocument[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>("id_card");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleUpload(formData: FormData) {
    setError(null);
    formData.set("client_id", clientId);
    formData.set("doc_type", docType);

    startTransition(async () => {
      const result = await uploadClientDocument(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'envoi du fichier.");
      }
    });
  }

  function handleDelete(id: string, storagePath: string) {
    setPendingDeleteId(id);
    startTransition(async () => {
      await deleteClientDocument(id, storagePath);
      setPendingDeleteId(null);
    });
  }

  async function handleView(storagePath: string) {
    const url = await getSignedDocumentUrlAction(storagePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-3 bg-gray-50 px-4 py-4">
      <form action={handleUpload} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <label className="label">Type de document</label>
          <select
            className="input"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
          >
            <option value="id_card">Carte d&apos;identité (CIN)</option>
            <option value="other">Autre document</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Fichier</label>
          <input
            type="file"
            name="file"
            required
            accept="image/*,.pdf"
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700"
          />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary shrink-0">
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Ajouter
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {documents.length === 0 ? (
        <p className="text-xs text-gray-400">Aucune pièce jointe pour ce client.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <button
                type="button"
                onClick={() => handleView(doc.storage_path)}
                className="flex min-w-0 items-center gap-2 text-left text-brand-700 hover:underline"
              >
                {doc.doc_type === "id_card" ? (
                  <IdCard size={14} className="shrink-0" />
                ) : (
                  <FileText size={14} className="shrink-0" />
                )}
                <span className="truncate">{doc.file_name}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(doc.id, doc.storage_path)}
                disabled={isPending && pendingDeleteId === doc.id}
                className="shrink-0 text-gray-400 hover:text-red-600 disabled:opacity-50"
                title="Supprimer"
              >
                {isPending && pendingDeleteId === doc.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
