"use client";

import { useRef, useState, useTransition } from "react";
import { Check, FileSpreadsheet, Loader2, Smartphone, Upload, Users, X } from "lucide-react";
import { bulkImportClients } from "@/lib/actions";
import {
  isContactPickerSupported,
  parseContactFile,
  pickPhoneContacts,
  ParsedContact,
} from "@/lib/contact-import";

interface PreviewRow extends ParsedContact {
  selected: boolean;
}

export default function ImportContactsCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const contactPickerAvailable = isContactPickerSupported();

  function loadContacts(parsed: ParsedContact[], from: string) {
    setError(null);
    setResultMsg(null);
    if (parsed.length === 0) {
      setError("Aucun contact exploitable n'a été trouvé dans ce fichier.");
      return;
    }
    setRows(parsed.map((c) => ({ ...c, selected: true })));
    setSource(from);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsParsing(true);
    setError(null);
    try {
      const parsed = await parseContactFile(file);
      loadContacts(parsed, `fichier « ${file.name} »`);
    } catch {
      setError(
        "Impossible de lire ce fichier. Formats acceptés : Excel (.xlsx, .xls), CSV, ou export de contacts (.vcf)."
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handlePickFromPhone() {
    setError(null);
    setResultMsg(null);
    try {
      const parsed = await pickPhoneContacts();
      loadContacts(parsed, "contacts du téléphone");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sélection des contacts annulée ou impossible.");
    }
  }

  function toggleRow(index: number) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));
  }

  function toggleAll(selected: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected })));
  }

  function reset() {
    setRows([]);
    setSource(null);
    setError(null);
  }

  function handleImport() {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      setError("Sélectionnez au moins un contact à importer.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await bulkImportClients(
        selected.map(({ full_name, phone, cin, address_notes }) => ({
          full_name,
          phone,
          cin,
          address_notes,
        }))
      );
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'import.");
        return;
      }
      setResultMsg(
        `${result.inserted ?? selected.length} client(s) importé(s) avec succès` +
          (result.skipped ? ` (${result.skipped} ligne(s) ignorée(s), nom manquant).` : ".")
      );
      setRows([]);
      setSource(null);
    });
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Importer des contacts</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Ajoutez plusieurs clients d&rsquo;un coup depuis votre téléphone, votre ordinateur, ou un
          fichier Excel/CSV déjà préparé.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePickFromPhone}
            disabled={!contactPickerAvailable || isParsing}
            title={
              contactPickerAvailable
                ? undefined
                : "Non pris en charge par ce navigateur — utilisez plutôt un fichier exporté depuis le téléphone (.vcf ou Excel)."
            }
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Smartphone size={14} />
            Contacts du téléphone
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Fichier (ordinateur ou téléphone)
          </button>

          <span className="flex items-center gap-1 self-center text-[11px] text-gray-400">
            <FileSpreadsheet size={13} />
            .xlsx, .xls, .csv, .vcf
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.vcf,.vcard"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={14} />
              {rows.length} contact(s) trouvé(s) — {source}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleAll(true)} className="text-[11px] text-brand-700 hover:underline">
                Tout cocher
              </button>
              <button type="button" onClick={() => toggleAll(false)} className="text-[11px] text-gray-400 hover:underline">
                Tout décocher
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-gray-600"
              >
                <X size={12} /> Annuler
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="w-8 px-2 py-2" />
                  <th className="px-2 py-2">Nom</th>
                  <th className="px-2 py-2">Téléphone</th>
                  <th className="px-2 py-2">Adresse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={i} className={row.selected ? "" : "opacity-40"}>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleRow(i)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-2 py-1.5 font-medium text-gray-800">{row.full_name}</td>
                    <td className="px-2 py-1.5 text-gray-600">{row.phone || "—"}</td>
                    <td className="px-2 py-1.5 truncate text-gray-500">{row.address_notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={isPending}
            className="btn-primary w-full"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Importer {rows.filter((r) => r.selected).length} contact(s)
          </button>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {resultMsg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{resultMsg}</p>
      )}
    </div>
  );
}
