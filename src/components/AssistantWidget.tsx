"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb, Sparkles, X } from "lucide-react";

interface Tip {
  title: string;
  items: string[];
}

const TIPS_BY_ROUTE: { match: (path: string) => boolean; tip: Tip }[] = [
  {
    match: (p) => p.startsWith("/dashboard"),
    tip: {
      title: "Le Dashboard",
      items: [
        "Cliquez sur une carte ou un graphique pour aller directement au détail (clients, prêts).",
        "Les boutons en haut de page permettent d'ajouter un client, un prêt ou d'inviter un superviseur en un clic.",
        "« Total exigible » regroupe les échéances en retard ou dues aujourd'hui : à surveiller en priorité.",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/clients"),
    tip: {
      title: "Clients & Carte",
      items: [
        "Collez un lien de localisation reçu sur WhatsApp pour géolocaliser un client automatiquement.",
        "Le bouton « Utiliser ma position actuelle » vous géolocalise si vous êtes chez le client.",
        "Cliquez sur un marqueur de la carte pour voir les coordonnées du client concerné.",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/loans"),
    tip: {
      title: "Gestion des prêts",
      items: [
        "Le montant total dû est calculé automatiquement (majoration de 20 % appliquée au montant initial).",
        "Enregistrez un règlement partiel ou total directement depuis la fiche du prêt.",
        "Un prêt passe automatiquement en retard dès que la date d'échéance est dépassée sans solde nul.",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/team"),
    tip: {
      title: "Équipe",
      items: [
        "Générez un lien d'invitation et partagez-le où vous voulez (WhatsApp, email…) : pas besoin de connaître l'email à l'avance.",
        "Cochez précisément ce qu'un superviseur peut voir et modifier, section par section.",
        "Vous pouvez modifier les accès d'un superviseur à tout moment depuis sa fiche.",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/settings"),
    tip: {
      title: "Paramètres",
      items: [
        "La couleur d'accent choisie ici s'applique instantanément à toute l'interface (boutons, liens, surbrillances).",
        "Votre logo apparaît dans le menu et sur la page de connexion.",
        "Pensez à enregistrer après chaque changement : les modifications ne sont pas automatiques.",
      ],
    },
  },
];

const DEFAULT_TIP: Tip = {
  title: "Bienvenue sur Créances Tracker",
  items: [
    "Utilisez les boutons du Dashboard pour ajouter rapidement clients, prêts ou membres d'équipe.",
    "Toutes vos données sont isolées et protégées : personne en dehors de votre organisation n'y a accès.",
  ],
};

export default function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const tip = TIPS_BY_ROUTE.find((t) => t.match(pathname))?.tip ?? DEFAULT_TIP;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-300/40">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Lightbulb size={15} className="text-brand-600" />
              {tip.title}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
          <ul className="space-y-2">
            {tip.items.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed text-gray-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] text-gray-400">
            Guide interactif — conseils contextuels selon la page consultée.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/80 text-white opacity-70 shadow-lg shadow-brand-900/20 backdrop-blur-sm transition hover:opacity-100 hover:bg-brand-600"
        aria-label="Assistance"
        title="Besoin d'aide ?"
      >
        <Sparkles size={20} />
      </button>
    </div>
  );
}
