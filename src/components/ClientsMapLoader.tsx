"use client";

import dynamic from "next/dynamic";
import { Client } from "@/lib/types";

// Leaflet accède à `window` au chargement : import dynamique sans SSR obligatoire.
const ClientsMap = dynamic(() => import("./ClientsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
      Chargement de la carte…
    </div>
  ),
});

export default function ClientsMapLoader({ clients }: { clients: Client[] }) {
  return <ClientsMap clients={clients} />;
}
