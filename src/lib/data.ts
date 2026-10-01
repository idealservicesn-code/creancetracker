import { createClient } from "@/lib/supabase/server";
import { Client, ClientDocument, Invitation, LoanWithBalance, Payment, Profile } from "@/lib/types";
import { isDueSoonOrOverdue } from "@/lib/utils";

export async function getClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientsWithCoordinates(): Promise<Client[]> {
  const clients = await getClients();
  return clients.filter((c) => c.latitude !== null && c.longitude !== null);
}

export async function getLoansWithBalance(): Promise<LoanWithBalance[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_loans_with_balance")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPaymentsForLoan(loanId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("payment_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentPayments(monthsBack = 6): Promise<Payment[]> {
  const supabase = createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - (monthsBack - 1));
  since.setDate(1);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .gte("payment_date", sinceStr)
    .order("payment_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Tous les règlements de l'organisation (sans filtre de date) — utilisé pour les widgets "par période" du dashboard, dont le total "Tout". */
export async function getAllPayments(): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** KPIs agrégés pour le dashboard, calculés à partir de v_loans_with_balance */
export function computeKpis(loans: LoanWithBalance[]) {
  const totalEncours = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => sum + l.balance_due, 0);

  const totalExigible = loans
    .filter((l) => l.is_overdue || l.is_due_today)
    .reduce((sum, l) => sum + l.balance_due, 0);

  const totalDue = loans.reduce((sum, l) => sum + l.total_due_amount, 0);
  const totalPaid = loans.reduce((sum, l) => sum + l.total_paid, 0);
  const tauxRecouvrement = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return { totalEncours, totalExigible, tauxRecouvrement, totalDue, totalPaid };
}

/**
 * Échéances à surveiller sur le dashboard : en retard, dues aujourd'hui, ou
 * arrivant à échéance dans les DUE_SOON_THRESHOLD_DAYS prochains jours (alerte
 * rouge anticipée, avant même le passage au statut "overdue").
 */
export function getUpcomingAndOverdueLoans(loans: LoanWithBalance[]): LoanWithBalance[] {
  return loans
    .filter((l) => l.status !== "paid" && isDueSoonOrOverdue(l))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/** Membres de l'organisation courante (RLS : limité à l'organisation de l'appelant, sauf super_admin). */
export async function getTeamMembers(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Invitations en attente (non acceptées, non expirées) de l'organisation courante. */
export async function getPendingInvitations(): Promise<Invitation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Toutes les pièces jointes de tous les clients, regroupées par client_id */
export async function getAllClientDocuments(): Promise<Record<string, ClientDocument[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const grouped: Record<string, ClientDocument[]> = {};
  for (const doc of data ?? []) {
    if (!grouped[doc.client_id]) grouped[doc.client_id] = [];
    grouped[doc.client_id].push(doc);
  }
  return grouped;
}
