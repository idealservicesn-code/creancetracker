"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  amounts: PeriodAmounts;
  currency?: string;
  tone?: "brand" | "emerald" | "amber";
  defaultPeriod?: PeriodKey;
}

const TONE_CLASSES: Record<NonNullable<PeriodAmountCardProps["tone"]>, { bg: string; text: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
};

export default function PeriodAmountCard({
  title,
  subtitle,
  icon: Icon,
  amounts,
  currency = DEFAULT_CURRENCY,
  tone = "brand",
  defaultPeriod = "month",
}: PeriodAmountCardProps) {
  const [period, setPeriod] = useState<PeriodKey>(defaultPeriod);
  const toneClasses = TONE_CLASSES[tone];

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClasses.bg)}>
          <Icon size={18} className={toneClasses.text} />
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
