import { LoanWithBalance } from "./types";
import { DEFAULT_CURRENCY } from "./currencies";

/** Calcule le montant total dû à partir du montant initial (majoration automatique de 20%) */
export function computeTotalDue(principal: number): number {
  if (!principal || Number.isNaN(principal)) return 0;
  return Math.round(principal * 1.2 * 100) / 100;
}

/**
 * Formate un montant dans la devise choisie par l'organisation (voir
 * organizations.currency). Repli sur un affichage "1 234,56 XOF" pour les codes
 * d'exception qu'Intl ne reconnaîtrait pas.
 */
export function formatMoney(amount: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  const value = amount ?? 0;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return (
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value) + ` ${currency}`
    );
  }
}

/** @deprecated utilisez formatMoney(amount, currency) — conservé pour compatibilité ascendante. */
export function formatDH(amount: number | null | undefined): string {
  return formatMoney(amount, DEFAULT_CURRENCY);
}

/** Formate une date ISO (YYYY-MM-DD) au format jj/mm/aaaa */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Renvoie le nombre de jours entre aujourd'hui et une date d'échéance (négatif = en retard) */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Nombre de jours avant échéance à partir duquel on signale la créance en rouge (alerte anticipée). */
export const DUE_SOON_THRESHOLD_DAYS = 5;

/**
 * Vrai si l'échéance est déjà dépassée, due aujourd'hui, ou arrive dans moins de
 * DUE_SOON_THRESHOLD_DAYS jours — signalement visuel en rouge, avant même le
 * passage officiel au statut "overdue" (qui ne bascule qu'après la date d'échéance).
 */
export function isDueSoonOrOverdue(loan: { status: string; due_date: string }): boolean {
  if (loan.status === "paid") return false;
  return daysUntil(loan.due_date) < DUE_SOON_THRESHOLD_DAYS;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "En cours";
    case "paid":
      return "Soldé";
    case "overdue":
      return "En retard";
    case "active":
      return "Actif";
    case "blacklisted":
      return "Liste noire";
    default:
      return status;
  }
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "ongoing":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "overdue":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "blacklisted":
      return "bg-gray-100 text-gray-700 ring-gray-500/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-600/20";
  }
}

/** Construit le message de rappel WhatsApp à partir d'une créance */
export function buildWhatsAppReminder(loan: LoanWithBalance, currency: string = DEFAULT_CURRENCY): string {
  return `Bonjour ${loan.client_full_name}, rappel du solde restant de ${formatMoney(
    loan.balance_due,
    currency
  )} pour l'échéance du ${formatDate(loan.due_date)}. Merci de bien vouloir régulariser votre situation dans les meilleurs délais.`;
}

/** Nettoie un numéro de téléphone (garde uniquement les chiffres, préfixe indicatif si besoin) */
export function toWhatsAppPhone(phone: string | null, defaultCountryCode = "221"): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length <= 9 && !digits.startsWith(defaultCountryCode)) {
    return `${defaultCountryCode}${digits.replace(/^0+/, "")}`;
  }
  return digits;
}

export function buildWhatsAppLink(loan: LoanWithBalance, currency: string = DEFAULT_CURRENCY): string {
  const text = encodeURIComponent(buildWhatsAppReminder(loan, currency));
  const phone = toWhatsAppPhone(loan.client_phone);
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** Agrège une liste de paiements par mois (aaaa-mm) pour le graphique du dashboard */
export function aggregateMonthlyCollections(
  payments: { amount_paid: number; payment_date: string }[],
  monthsBack = 6
): { month: string; label: string; total: number }[] {
  const now = new Date();
  const buckets: { month: string; label: string; total: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
    buckets.push({ month, label, total: 0 });
  }

  const index = new Map(buckets.map((b) => [b.month, b]));

  for (const p of payments) {
    const month = p.payment_date.slice(0, 7);
    const bucket = index.get(month);
    if (bucket) bucket.total += Number(p.amount_paid);
  }

  return buckets;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface StatusSlice {
  status: string;
  label: string;
  count: number;
  color: string;
}

/** Répartition des échéances par statut (pour le dashboard) */
export function computeLoanStatusBreakdown(loans: LoanWithBalance[]): StatusSlice[] {
  const meta: Record<string, { label: string; color: string }> = {
    ongoing: { label: "En cours", color: "#2f8f72" },
    overdue: { label: "En retard", color: "#ef4444" },
    paid: { label: "Soldé", color: "#10b981" },
  };
  const counts: Record<string, number> = { ongoing: 0, overdue: 0, paid: 0 };

  for (const l of loans) {
    const key = l.status === "ongoing" && l.is_overdue ? "overdue" : l.status;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      label: meta[status]?.label ?? status,
      count,
      color: meta[status]?.color ?? "#9ca3af",
    }));
}

/** Répartition des clients par statut (pour le dashboard) */
export function computeClientStatusBreakdown(
  clients: { status: string }[]
): StatusSlice[] {
  const meta: Record<string, { label: string; color: string }> = {
    active: { label: "Actifs", color: "#2f8f72" },
    blacklisted: { label: "Liste noire", color: "#6b7280" },
  };
  const counts: Record<string, number> = { active: 0, blacklisted: 0 };

  for (const c of clients) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      label: meta[status]?.label ?? status,
      count,
      color: meta[status]?.color ?? "#9ca3af",
    }));
}

// ----------------------------------------------------------------------------
// Montants par période (dashboard) : prêts décaissés et bénéfice reçu, filtrés
// par semaine en cours / mois en cours / année en cours / depuis toujours.
// ----------------------------------------------------------------------------
export interface PeriodAmounts {
  week: number;
  month: number;
  year: number;
  all: number;
}

export type PeriodKey = keyof PeriodAmounts;

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Cette semaine",
  month: "Ce mois-ci",
  year: "Cette année",
  all: "Depuis toujours",
};

/** Additionne des montants datés dans les 4 fenêtres (semaine/mois/année en cours, et total). */
function sumByPeriod(entries: { date: string; amount: number }[]): PeriodAmounts {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Semaine en cours = lundi 00:00 → dimanche 23:59 (ISO, lundi = début de semaine).
  const dayIdx = (now.getDay() + 6) % 7; // lundi=0 … dimanche=6
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayIdx);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7); // borne exclusive

  const result: PeriodAmounts = { week: 0, month: 0, year: 0, all: 0 };

  for (const { date, amount } of entries) {
    if (!date || !Number.isFinite(amount)) continue;
    const d = new Date(date + "T00:00:00");
    if (Number.isNaN(d.getTime())) continue;

    result.all += amount;
    if (d.getFullYear() === now.getFullYear()) {
      result.year += amount;
      if (d.getMonth() === now.getMonth()) result.month += amount;
    }
    if (d >= weekStart && d < weekEnd) result.week += amount;
  }

  return result;
}

/** Montant des prêts décaissés (capital initial) par période, basé sur la date d'émission. */
export function computeLoanPrincipalByPeriod(
  loans: { issue_date: string; principal_amount: number }[]
): PeriodAmounts {
  return sumByPeriod(loans.map((l) => ({ date: l.issue_date, amount: Number(l.principal_amount) })));
}

/**
 * Bénéfice reçu par période : la part "majoration" de chaque règlement encaissé,
 * reconnue au prorata du taux de marge du prêt concerné (majoration / montant
 * total dû). Ex: un prêt majoré de 20% (total dû = capital × 1.2) a une marge de
 * 1 - (1/1.2) ≈ 16,7% — chaque règlement reçu sur ce prêt compte pour 16,7% de
 * bénéfice et 83,3% de récupération de capital. Basé sur la date du règlement.
 */
export function computeProfitReceivedByPeriod(
  loans: { id: string; principal_amount: number; total_due_amount: number }[],
  payments: { loan_id: string; amount_paid: number; payment_date: string }[]
): PeriodAmounts {
  const marginByLoan = new Map(
    loans.map((l) => {
      const total = Number(l.total_due_amount);
      const margin = total > 0 ? Math.max(0, (total - Number(l.principal_amount)) / total) : 0;
      return [l.id, margin];
    })
  );

  const entries = payments.map((p) => ({
    date: p.payment_date,
    amount: Number(p.amount_paid) * (marginByLoan.get(p.loan_id) ?? 0),
  }));

  return sumByPeriod(entries);
}

export interface DebtorSlice {
  client: string;
  balance: number;
}

/**
 * Les N clients ayant le solde restant le plus élevé (prêts non soldés).
 * Number(...) est nécessaire : balance_due est une colonne numeric Postgres,
 * renvoyée en chaîne par Supabase.
 */
export function computeTopDebtors(loans: LoanWithBalance[], limit = 5): DebtorSlice[] {
  const byClient = new Map<string, DebtorSlice>();

  for (const l of loans) {
    const balanceDue = Number(l.balance_due);
    if (l.status === "paid" || balanceDue <= 0) continue;
    const existing = byClient.get(l.client_id);
    if (existing) {
      existing.balance += balanceDue;
    } else {
      byClient.set(l.client_id, { client: l.client_full_name, balance: balanceDue });
    }
  }

  return Array.from(byClient.values())
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
