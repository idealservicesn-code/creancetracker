"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, CircleDollarSign } from "lucide-react";
import { recordPayment } from "@/lib/actions";
import VoiceInputButton from "./VoiceInputButton";

export default function PaymentForm({
  loanId,
  onRecorded,
}: {
  loanId: string;
  onRecorded?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("loan_id", loanId);

    startTransition(async () => {
      const result = await recordPayment(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'enregistrement du règlement.");
        return;
      }
      formRef.current?.reset();
      onRecorded?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="loan_id" value={loanId} />
      <div>
        <label className="label !mb-0.5 text-xs">Montant (DH)</label>
        <input
          name="amount_paid"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="input w-32 py-1.5"
          placeholder="5000"
        />
      </div>
      <div>
        <label className="label !mb-0.5 text-xs">Date</label>
        <input
          name="payment_date"
          type="date"
          defaultValue={today}
          className="input w-36 py-1.5"
        />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="label !mb-0.5 text-xs">Notes</label>
        <div className="flex gap-1">
          <input ref={notesRef} name="notes" className="input flex-1 py-1.5" placeholder="Optionnel" />
          <VoiceInputButton
            onResult={(text) => {
              const el = notesRef.current;
              if (!el) return;
              el.value = el.value ? `${el.value} ${text}` : text;
            }}
            className="h-8 w-8"
          />
        </div>
      </div>
      <button type="submit" disabled={isPending} className="btn-primary py-1.5">
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <CircleDollarSign size={14} />}
        Enregistrer
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
