import Link from "next/link";
import { CreditCard, Settings, UserPlus, Users, Wallet } from "lucide-react";

interface QuickAction {
  href: string;
  label: string;
  icon: typeof Users;
  tone: "brand" | "gray";
}

export default function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  const actions: QuickAction[] = [
    { href: "/clients", label: "Ajouter un client", icon: Users, tone: "brand" },
    { href: "/loans", label: "Ajouter un prêt", icon: Wallet, tone: "brand" },
    { href: "/loans", label: "Enregistrer un paiement", icon: CreditCard, tone: "gray" },
  ];

  if (isAdmin) {
    actions.push(
      { href: "/team", label: "Inviter un superviseur", icon: UserPlus, tone: "gray" },
      { href: "/settings", label: "Paramètres", icon: Settings, tone: "gray" }
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {actions.map((action, i) => (
        <Link
          key={`${action.href}-${action.label}-${i}`}
          href={action.href}
          className={
            action.tone === "brand"
              ? "inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              : "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          }
        >
          <action.icon size={16} />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
