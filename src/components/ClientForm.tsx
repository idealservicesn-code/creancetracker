"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClientRecord } from "@/lib/actions";
import VoiceInputButton from "./VoiceInputButton";

export default function ClientForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function appendDictation(ref: React.RefObject<HTMLInputElement>, text: string) {
    const el = ref.current;
    if (!el) return;
    el.value = el.value ? `${el.value} ${text}` : text;
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createClientRecord(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      formRef.current?.reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Ajouter un client</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className="label">
            Nom complet *
          </label>
          <div className="flex gap-1.5">
            <input
              ref={fullNameRef}
              id="full_name"
              name="full_name"
              required
              className="input flex-1"
              placeholder="Ex: Awa Ndiaye"
            />
            <VoiceInputButton onResult={(text) => appendDictation(fullNameRef, text)} />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Téléphone
          </label>
          <input id="phone" name="phone" className="input" placeholder="+221 77 000 00 00" />
        </div>

        <div>
          <label htmlFor="cin" className="label">
            CIN
          </label>
          <input id="cin" name="cin" className="input" placeholder="N° carte d'identité" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address_notes" className="label">
            Adresse / repères
          </label>
          <div className="flex gap-1.5">
            <input
              ref={addressRef}
              id="address_notes"
              name="address_notes"
              className="input flex-1"
              placeholder="Quartier, repère, indications d'accès…"
            />
            <VoiceInputButton onResult={(text) => appendDictation(addressRef, text)} />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="label">
            Statut
          </label>
          <select id="status" name="status" defaultValue="active" className="input">
            <option value="active">Actif</option>
            <option value="blacklisted">Liste noire</option>
          </select>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Client ajouté avec succès.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Ajouter le client
      </button>
    </form>
  );
}
