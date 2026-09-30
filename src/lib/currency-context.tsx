"use client";

import { createContext, useContext } from "react";
import { formatMoney } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

const CurrencyContext = createContext<string>(DEFAULT_CURRENCY);

/** Fournit la devise de l'organisation courante à tout l'arbre de composants client (dashboard, prêts, clients…). */
export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): string {
  return useContext(CurrencyContext);
}

/** Raccourci : formate un montant directement dans la devise de l'organisation. */
export function useFormatMoney() {
  const currency = useCurrency();
  return (amount: number | null | undefined) => formatMoney(amount, currency);
}
