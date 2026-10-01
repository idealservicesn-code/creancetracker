import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { LoanWithBalance } from "@/lib/types";
import {
  DUE_SOON_THRESHOLD_DAYS,
  formatMoney,
  formatDate,
  isDueSoonOrOverdue,
  statusBadgeClasses,
  statusLabel,
} from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

export default function DueLoansList({
  loans,
  currency = DEFAULT_CURRENCY,
}: {
  loans: LoanWithBalance[];
  currency?: string;
}) {
  if (loans.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-10 text-center text-sm text-gray-400">
        Aucune échéance en retard ou arrivant à échéance dans les {DUE_SOON_THRESHOLD_DAYS} prochains
        jours. 🎉
      </div>
    );
  }

  return (
    <div className="card overflow-hidden !p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Échéance</th>
            <th className="px-4 py-3">Solde restant</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loans.map((loan) => (
            <tr key={loan.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link href="/loans" className="font-medium text-gray-900 hover:text-brand-600">
                  {loan.client_full_name}
                </Link>
                {loan.client_phone && (
                  <p className="text-xs text-gray-400">{loan.client_phone}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                <span
                  className={`flex items-center gap-1.5 ${
                    isDueSoonOrOverdue(loan) ? "font-medium text-red-600" : ""
                  }`}
                >
                  {isDueSoonOrOverdue(loan) && <AlertTriangle size={14} className="text-red-500" />}
                  {formatDate(loan.due_date)}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {formatMoney(loan.balance_due, currency)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                    loan.status
                  )}`}
                >
                  {statusLabel(loan.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
