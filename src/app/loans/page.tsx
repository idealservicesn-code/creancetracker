import { getClients, getLoansWithBalance } from "@/lib/data";
import LoanForm from "@/components/LoanForm";
import LoanRow from "@/components/LoanRow";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const [clients, loans] = await Promise.all([getClients(), getLoansWithBalance()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Gestion des prêts</h1>
        <p className="text-sm text-gray-500">
          Création d&apos;échéances, suivi des règlements et rappels WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LoanForm clients={clients} />
        </div>

        <div className="space-y-3 lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Toutes les échéances ({loans.length})
          </h2>
          {loans.length === 0 ? (
            <div className="card flex items-center justify-center py-10 text-sm text-gray-400">
              Aucune échéance créée pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {loans.map((loan) => (
                <LoanRow key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
