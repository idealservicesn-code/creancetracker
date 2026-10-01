"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Plus, RotateCcw } from "lucide-react";
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
  const [totalDue, setTotalDue] = useState("");
  const [totalDueTouched, setTotalDueTouched] = useState(false);
  const currency = useCurrency();
  const formatMoney = useFormatMoney();

  const today = new Date().toISOString().slice(0, 10);
  const activeClients = clients.filter((c) => c.status !== "blacklisted");

  // Le montant total dû suit automatiquement le montant initial (+20%) tant que
  // l'utilisateur n'a pas modifié ce champ lui-même.
  useEffect(() => {
    if (totalDueTouched) return;
    const auto = computeTotalDue(Number(principal));
    setTotalDue(principal ? String(auto) : "");
  }, [principal, totalDueTouched]);

  function resetToAuto() {
    setTotalDueTouched(false);
    setTotalDue(principal ? String(computeTotalDue(Number(principal))) : "");
  }

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
      setTotalDue("");
      setTotalDueTouched(false);
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
          <div className="flex gap-1.5">
            <input
              id="total_due_amount"
              name="total_due_amount"
              type="number"
              step="0.01"
              min="0"
              className="input flex-1"
              placeholder="Calculé automatiquement"
              value={totalDue}
              onChange={(e) => {
                setTotalDueTouched(true);
                setTotalDue(e.target.value);
              }}
            />
            {totalDueTouched && (
              <button
                type="button"
                onClick={resetToAuto}
                title="Revenir au calcul automatique (+20%)"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {totalDueTouched
              ? "Montant modifié manuellement."
              : "Calculé automatiquement : montant initial + 20% de majoration (modifiable si besoin)."}
            {principal && !Number.isNaN(Number(principal)) && (
              <span className="ml-1 text-gray-300">
                · auto : {formatMoney(computeTotalDue(Number(principal)))}
              </span>
            )}
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
