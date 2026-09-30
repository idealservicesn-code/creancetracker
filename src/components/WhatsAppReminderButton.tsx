"use client";

import { useState } from "react";
import { MessageCircle, Check } from "lucide-react";
import { LoanWithBalance } from "@/lib/types";
import { buildWhatsAppLink, buildWhatsAppReminder } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";

export default function WhatsAppReminderButton({ loan }: { loan: LoanWithBalance }) {
  const [copied, setCopied] = useState(false);
  const currency = useCurrency();

  async function handleClick() {
    const text = buildWhatsAppReminder(loan, currency);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le clipboard peut être indisponible (contexte non sécurisé) : on continue quand même.
    }
    window.open(buildWhatsAppLink(loan, currency), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      title="Générer et envoyer un rappel WhatsApp"
    >
      {copied ? <Check size={14} /> : <MessageCircle size={14} />}
      {copied ? "Texte copié" : "Rappel WhatsApp"}
    </button>
  );
}
