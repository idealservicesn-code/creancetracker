import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * En-tête de carte cliquable : titre + sous-titre à gauche, lien "Voir →" à
 * droite, redirigeant vers l'onglet concerné. Le contenu interactif de la
 * carte (graphique Recharts, etc.) reste en dehors du lien pour ne pas
 * gêner les survols/tooltips.
 */
export default function CardHeaderLink({
  title,
  subtitle,
  href,
  linkLabel = "Voir tout",
}: {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs font-medium text-brand-700 hover:underline"
      >
        {linkLabel}
        <ChevronRight
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
