"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Client } from "@/lib/types";
import { statusLabel } from "@/lib/utils";
import {
  activeClientIcon,
  blacklistedClientIcon,
  LOCATED_ZOOM,
  WORLD_CENTER,
  WORLD_ZOOM,
} from "@/lib/mapIcons";

/** Petit contrôle flottant "Me localiser" qui recentre la carte sur la position du navigateur. */
function LocateControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLocate() {
    if (!navigator.geolocation) {
      setError("Géolocalisation indisponible");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], LOCATED_ZOOM, {
          duration: 1,
        });
        setLocating(false);
      },
      () => {
        setError("Position refusée");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: 10, marginRight: 10 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleLocate}
          title="Me localiser"
          className="flex h-8 w-8 items-center justify-center bg-white text-gray-600 hover:bg-gray-50"
        >
          {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
        </button>
        {error && (
          <span className="absolute right-9 top-0 whitespace-nowrap rounded bg-white px-2 py-1 text-[11px] text-red-600 shadow">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** Recentre automatiquement la carte une fois la position obtenue (uniquement si aucun client n'est géolocalisé). */
function AutoLocateOnEmpty({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], LOCATED_ZOOM);
      },
      () => {
        // Position refusée ou indisponible : on reste sur la vue mondiale par défaut.
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return null;
}

export default function ClientsMap({ clients }: { clients: Client[] }) {
  const withCoords = clients.filter(
    (c) => c.latitude !== null && c.longitude !== null
  ) as (Client & { latitude: number; longitude: number })[];

  const hasClients = withCoords.length > 0;

  // Centre initial : moyenne des clients géolocalisés (vue d'ensemble du portefeuille),
  // sinon une vue mondiale neutre en attendant une éventuelle géolocalisation.
  const center: [number, number] = hasClients
    ? [
        withCoords.reduce((sum, c) => sum + c.latitude, 0) / withCoords.length,
        withCoords.reduce((sum, c) => sum + c.longitude, 0) / withCoords.length,
      ]
    : WORLD_CENTER;
  const zoom = hasClients ? 11 : WORLD_ZOOM;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateControl />
      <AutoLocateOnEmpty enabled={!hasClients} />
      {withCoords.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={c.status === "blacklisted" ? blacklistedClientIcon : activeClientIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{c.full_name}</p>
              {c.phone && <p>{c.phone}</p>}
              <p className="text-xs text-gray-500">{statusLabel(c.status)}</p>
              {c.address_notes && <p className="mt-1 text-xs">{c.address_notes}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
