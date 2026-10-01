"use client";

import { ReactNode, useState } from "react";
import { PERIOD_LABELS, PeriodAmounts, PeriodKey, cn, formatMoney } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

const PERIOD_ORDER: PeriodKey[] = ["week", "month", "year", "all"];
const PERIOD_SHORT_LABELS: Record<PeriodKey, string> = {
  week: "Semaine",
  month: "Mois",
  year: "Année",
  all: "Total",
};

interface PeriodAmountCardProps {
  title: string;
  subtitle?: string;
  // Icône déjà rendue (ex: <HandCoins size={18} className="text-brand-700" />),
  // et non une référence de composant : un composant Server ne peut pas passer
  // une fonction/référence de composant brute à un Client Component (erreur de
  // sérialisation RSC — "a server-side exception has occurred" en production).
  // Un élément JSX déjà construit, lui, est sérialisable sans problème.
  icon: ReactNode;
  amounts: PeriodAmounts;
  currency?: string;
  tone?: "brand" | "emerald" | "amber";
  defaultPeriod?: PeriodKey;
}

const TONE_BG_CLASSES: Record<NonNullable<PeriodAmountCardProps["tone"]>, string> = {
  brand: "bg-brand-50",
  emerald: "bg-emerald-50",
  amber: "bg-amber-50",
};

export default function PeriodAmountCard({
  title,
  subtitle,
  icon,
  amounts,
  currency = DEFAULT_CURRENCY,
  tone = "brand",
  defaultPeriod = "month",
}: PeriodAmountCardProps) {
  const [period, setPeriod] = useState<PeriodKey>(defaultPeriod);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_BG_CLASSES[tone])}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-900">{formatMoney(amounts[period], currency)}</p>
      <p className="mt-0.5 text-xs text-gray-400">{PERIOD_LABELS[period]}</p>

      <div className="mt-4 flex gap-1 rounded-lg bg-gray-50 p-1">
        {PERIOD_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
              period === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {PERIOD_SHORT_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
