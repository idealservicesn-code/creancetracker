"use client";

import dynamic from "next/dynamic";

// La librairie de lecture Excel/CSV est assez lourde : chargement différé,
// uniquement pour les administrateurs qui voient réellement cette carte.
const ImportContactsCard = dynamic(() => import("./ImportContactsCard"), {
  ssr: false,
  loading: () => (
    <div className="card flex h-24 items-center justify-center text-sm text-gray-400">
      Chargement…
    </div>
  ),
});

export default function ImportContactsLoader() {
  return <ImportContactsCard />;
}
