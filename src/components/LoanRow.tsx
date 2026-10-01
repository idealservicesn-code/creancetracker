"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { LoanWithBalance, Payment } from "@/lib/types";
import { formatDate, isDueSoonOrOverdue, statusBadgeClasses, statusLabel } from "@/lib/utils";
import { getPaymentsAction } from "@/lib/actions";
import { useFormatMoney } from "@/lib/currency-context";
import PaymentForm from "./PaymentForm";
import WhatsAppReminderButton from "./WhatsAppReminderButton";

export default function LoanRow({ loan }: { loan: LoanWithBalance }) {
  const [expanded, setExpanded] = useState(false);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const formatMoney = useFormatMoney();

  function loadPayments() {
    startTransition(async () => {
      const data = await getPaymentsAction(loan.id);
      setPayments(data);
    });
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && payments === null) loadPayments();
  }

  const progressPct =
    loan.total_due_amount > 0
      ? Math.min(100, Math.round((loan.total_paid / loan.total_due_amount) * 100))
      : 0;

  return (
    <div className="card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-gray-900">{loan.client_full_name}</p>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                loan.status
              )}`}
            >
              {statusLabel(loan.status)}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            {isDueSoonOrOverdue(loan) && <AlertTriangle size={12} className="shrink-0 text-red-500" />}
            <span className={isDueSoonOrOverdue(loan) ? "font-medium text-red-600" : ""}>
              Échéance : {formatDate(loan.due_date)}
            </span>
            <span>· Émis le {formatDate(loan.issue_date)}</span>
          </p>
        </div>

        <div className="hidden shrink-0 sm:block sm:w-40">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-400">{progressPct}% réglé</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">{formatMoney(loan.balance_due)}</p>
          <p className="text-xs text-gray-400">sur {formatMoney(loan.total_due_amount)}</p>
        </div>

        {expanded ? (
          <ChevronUp size={18} className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-gray-100 bg-gray-50/60 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-gray-500">
              Principal initial : <span className="font-medium">{formatMoney(loan.principal_amount)}</span>
              {" · "}
              Total payé : <span className="font-medium">{formatMoney(loan.total_paid)}</span>
            </div>
            <WhatsAppReminderButton loan={loan} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Enregistrer un règlement
            </p>
            <PaymentForm loanId={loan.id} onRecorded={loadPayments} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Historique des règlements
            </p>
            {isPending && payments === null ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
            ) : payments && payments.length > 0 ? (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{formatMoney(p.amount_paid)}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatDate(p.payment_date)}</span>
                    </div>
                    {p.notes && <span className="text-xs text-gray-400">{p.notes}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">Aucun règlement enregistré pour cette échéance.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
