import { AlertCircle, TrendingUp, Users, Wallet } from "lucide-react";
import {
  computeKpis,
  getClients,
  getLoansWithBalance,
  getRecentPayments,
  getUpcomingAndOverdueLoans,
} from "@/lib/data";
import {
  aggregateMonthlyCollections,
  computeClientStatusBreakdown,
  computeLoanStatusBreakdown,
  computeTopDebtors,
  formatMoney,
} from "@/lib/utils";
import KpiCard from "@/components/KpiCard";
import MonthlyCollectionsChart from "@/components/MonthlyCollectionsChart";
import DueLoansList from "@/components/DueLoansList";
import StatusPieChart from "@/components/StatusPieChart";
import TopDebtorsChart from "@/components/TopDebtorsChart";
import CardHeaderLink from "@/components/CardHeaderLink";
import QuickActions from "@/components/QuickActions";
import { getCurrentOrganization, getCurrentProfile, isAdminOrAbove } from "@/lib/auth";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [loans, recentPayments, clients, profile] = await Promise.all([
    getLoansWithBalance(),
    getRecentPayments(6),
    getClients(),
    getCurrentProfile(),
  ]);

  const organization = await getCurrentOrganization(profile);
  const currency = organization?.currency ?? DEFAULT_CURRENCY;

  const kpis = computeKpis(loans);
  const chartData = aggregateMonthlyCollections(recentPayments, 6);
  const dueLoans = getUpcomingAndOverdueLoans(loans);
  const loanStatusData = computeLoanStatusBreakdown(loans);
  const clientStatusData = computeClientStatusBreakdown(clients);
  const topDebtors = computeTopDebtors(loans, 5);
  const activeClientsCount = clients.filter((c) => c.status !== "blacklisted").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Vue d&apos;ensemble du portefeuille de créances et des recouvrements
        </p>
      </div>

      <QuickActions isAdmin={isAdminOrAbove(profile)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Encours"
          value={formatMoney(kpis.totalEncours, currency)}
          icon={Wallet}
          tone="brand"
          hint="Solde restant sur les prêts non soldés"
          href="/loans"
        />
        <KpiCard
          label="Total Exigible"
          value={formatMoney(kpis.totalExigible, currency)}
          icon={AlertCircle}
          tone="red"
          hint="Échéances en retard ou dues aujourd'hui"
          href="/loans"
        />
        <KpiCard
          label="Taux de Recouvrement"
          value={`${kpis.tauxRecouvrement.toFixed(1)} %`}
          icon={TrendingUp}
          tone="emerald"
          hint={`${formatMoney(kpis.totalPaid, currency)} encaissés sur ${formatMoney(kpis.totalDue, currency)}`}
          href="/loans"
        />
        <KpiCard
          label="Clients actifs"
          value={String(activeClientsCount)}
          icon={Users}
          tone="amber"
          hint={`Sur ${clients.length} client(s) au total`}
          href="/clients"
        />
      </div>

      <div className="card">
        <CardHeaderLink
          title="Encaissements mensuels"
          subtitle="6 derniers mois"
          href="/loans"
          linkLabel="Gérer les prêts"
        />
        <MonthlyCollectionsChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <CardHeaderLink
            title="Répartition des échéances"
            subtitle="Par statut"
            href="/loans"
            linkLabel="Gérer les prêts"
          />
          <StatusPieChart
            data={loanStatusData}
            unitLabel="échéance(s)"
            emptyLabel="Aucune échéance pour le moment."
          />
        </div>
        <div className="card">
          <CardHeaderLink
            title="Répartition des clients"
            subtitle="Par statut"
            href="/clients"
            linkLabel="Voir les clients"
          />
          <StatusPieChart
            data={clientStatusData}
            unitLabel="client(s)"
            emptyLabel="Aucun client pour le moment."
          />
        </div>
        <div className="card">
          <CardHeaderLink
            title="Top 5 débiteurs"
            subtitle="Solde restant le plus élevé"
            href="/loans"
            linkLabel="Gérer les prêts"
          />
          <TopDebtorsChart data={topDebtors} />
        </div>
      </div>

      <div>
        <CardHeaderLink
          title="Échéances en retard ou arrivant à terme aujourd'hui"
          href="/loans"
          linkLabel="Gérer les prêts"
        />
        <DueLoansList loans={dueLoans} currency={currency} />
      </div>
    </div>
  );
}
