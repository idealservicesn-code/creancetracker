"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { createLoan } from "@/lib/actions";
import { Client } from "@/lib/types";
import { computeTotalDue } from "@/lib/utils";
import { useCurrency, useFormatMoney } from "@/lib/currency-context";

export default function LoanForm({ clients }: { clients: Client[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [principal, setPrincipal] = useState("");
  const currency = useCurrency();
  const formatMoney = useFormatMoney();

  const today = new Date().toISOString().slice(0, 10);
  const activeClients = clients.filter((c) => c.status !== "blacklisted");
  const totalDue = computeTotalDue(Number(principal));

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createLoan(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de la création de l'échéance.");
        return;
      }
      formRef.current?.reset();
      setPrincipal("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Créer une échéance</h2>

      <div>
        <label htmlFor="client_id" className="label">
          Client *
        </label>
        <select id="client_id" name="client_id" required className="input" defaultValue="">
          <option value="" disabled>
            Sélectionner un client…
          </option>
          {activeClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} {c.phone ? `— ${c.phone}` : ""}
            </option>
          ))}
        </select>
        {clients.some((c) => c.status === "blacklisted") && (
          <p className="mt-1 text-xs text-gray-400">
            Les clients en liste noire n&apos;apparaissent pas dans cette liste.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="principal_amount" className="label">
            Montant initial ({currency}) *
          </label>
          <input
            id="principal_amount"
            name="principal_amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="input"
            placeholder="50000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="total_due_amount" className="label">
            Montant total dû ({currency})
          </label>
          <input
            id="total_due_amount"
            type="text"
            readOnly
            className="input cursor-not-allowed bg-gray-50 text-gray-600"
            value={principal ? formatMoney(totalDue) : ""}
            placeholder="Calculé automatiquement"
          />
          <p className="mt-1 text-xs text-gray-400">
            Calculé automatiquement : montant initial + 20% de majoration.
          </p>
        </div>

        <div>
          <label htmlFor="issue_date" className="label">
            Date d&apos;émission
          </label>
          <input
            id="issue_date"
            name="issue_date"
            type="date"
            defaultValue={today}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="due_date" className="label">
            Date d&apos;échéance *
          </label>
          <input id="due_date" name="due_date" type="date" required className="input" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Échéance créée avec succès.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Créer l&apos;échéance
      </button>
    </form>
  );
}
